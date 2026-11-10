import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Form } from 'react-bootstrap';
import { documentsApi } from '../../../services/api/documentsApi';
import {
  DOCUMENT_TYPE_OPTIONS,
  formatFileSize,
  getDocumentState,
  getTypeLabel,
} from '../../../biz/documents/Documents.data';
import ConfirmDialog from '../../../shared/confirmDialog/ConfirmDialog';
import EmptyState from '../../../shared/emptyState/EmptyState';
import { SkeletonRows } from '../../../shared/skeleton/Skeleton';
import { useToast } from '../../../shared/toast/toast.context';
import { usePreferences } from '../../../services/preferences/preferences.context';
import { formatDate } from '../../../services/utils/format';
import { isLawyer, isSysadmin } from '../../../services/consts/roles';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const CaseDocuments = ({ legalCase, currentUser }) => {
  const { showToast } = useToast();
  const { preferences } = usePreferences();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [typeValue, setTypeValue] = useState('');
  const [file, setFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [draft, setDraft] = useState(null);
  const fileInputRef = useRef(null);

  const canWrite = isSysadmin(currentUser?.role) || isLawyer(currentUser?.role);
  const isClosed = String(legalCase?.status ?? '').toLowerCase() === 'cerrado';

  const caseId = legalCase?.id;

  const loadDocuments = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);
    try {
      setDocuments(await documentsApi.getAll(caseId));
    } catch (error) {
      showToast({ variant: 'danger', message: error.message });
    } finally {
      setLoading(false);
    }
  }, [caseId, showToast]);

  useEffect(() => {
    let active = true;

    (async () => {
      // Yield to a callback frame so loadDocuments' setLoading is async.
      await Promise.resolve();
      if (!active) return;
      await loadDocuments();
    })();

    return () => {
      active = false;
    };
  }, [loadDocuments]);

  // Draft PDFs travel as base64; build a blob URL for the inline preview and
  // let the cleanup below hand it back to the browser on replace/unmount.
  const draftObjectUrl = useMemo(() => {
    if (!draft?.pdfBase64) return null;
    const binary = atob(draft.pdfBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  }, [draft]);

  useEffect(() => {
    return () => {
      if (draftObjectUrl) URL.revokeObjectURL(draftObjectUrl);
    };
  }, [draftObjectUrl]);

  const stageFile = (selected) => {
    if (!selected) return;

    const looksLikePdf =
      selected.type === 'application/pdf' ||
      String(selected.name ?? '').toLowerCase().endsWith('.pdf');
    if (!looksLikePdf) {
      showToast({ variant: 'warning', message: 'Solo se aceptan archivos PDF.' });
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      showToast({ variant: 'warning', message: 'El archivo supera el tamaño máximo permitido (10 MB).' });
      return;
    }

    setFile(selected);
  };

  const handleFileInputChange = (event) => {
    stageFile(event.target.files?.[0] ?? null);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleDropzoneKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    stageFile(event.dataTransfer.files?.[0]);
  };

  const handleUnstageFile = () => {
    setFile(null);
    // Remounting the input clears the browser-held selection as well.
    setFileInputKey((key) => key + 1);
  };

  const resetForm = () => {
    setTypeValue('');
    handleUnstageFile();
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!typeValue || !file) {
      showToast({ variant: 'warning', message: 'Este campo es obligatorio.' });
      return;
    }

    setUploading(true);
    try {
      await documentsApi.upload(legalCase.id, typeValue, file);
      showToast({ variant: 'success', message: 'Documento cargado correctamente.' });
      resetForm();
      await loadDocuments();
    } catch (error) {
      showToast({ variant: 'danger', message: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const { blob, fileName } = await documentsApi.download(doc.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName ?? doc.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      showToast({ variant: 'danger', message: error.message });
    }
  };

  // One draft at a time: generating again simply replaces the previous one.
  const handleGenerate = async (kind) => {
    setGenerating(true);
    try {
      const raw =
        kind === 'summary'
          ? await documentsApi.generateAiSummary(caseId)
          : await documentsApi.generateConstancia(caseId);
      setDraft({ ...raw, generatedByAi: kind === 'summary' });
    } catch (error) {
      showToast({ variant: 'danger', message: error.message });
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await documentsApi.saveGenerated({
        caseId,
        pdfBase64: draft.pdfBase64,
        summaryText: draft.summaryText,
        generatedByAi: draft.generatedByAi,
      });
      showToast({
        variant: 'success',
        message: draft.generatedByAi
          ? 'Resumen guardado como documento del expediente.'
          : 'Constancia guardada en el expediente.',
      });
      setDraft(null);
      await loadDocuments();
    } catch (error) {
      showToast({ variant: 'danger', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscardDraft = () => {
    setDraft(null);
    showToast({ variant: 'info', message: 'Borrador descartado. No se guardó nada.' });
  };

  const handleDeleteConfirmed = async () => {
    const doc = pendingDelete;
    if (!doc) return;
    await documentsApi.remove(doc.id);
    showToast({ variant: 'success', message: 'Documento eliminado.' });
    setPendingDelete(null);
    await loadDocuments();
  };

  return (
    <section className="app-panel case-docs">
      <h3 className="app-panel__title">Documentos</h3>

      {canWrite ? (
        <div className="case-docs__toolbar">
          {isClosed ? (
            <p className="case-docs__hint">
              El expediente está cerrado: no admite la subida de documentos nuevos.
            </p>
          ) : (
            <>
              <form className="case-docs__form" onSubmit={handleUpload}>
                <div
                  className={`case-docs__dropzone${dragActive ? ' case-docs__dropzone--active' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-label="Zona para arrastrar o elegir un archivo PDF"
                  onClick={openFilePicker}
                  onKeyDown={handleDropzoneKeyDown}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    key={fileInputKey}
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    aria-label="Archivo PDF (hasta 10 MB)"
                    hidden
                    onChange={handleFileInputChange}
                  />
                  <span className="case-docs__dropzone-title">Arrastrá tu PDF acá</span>
                  <span className="case-docs__dropzone-subtitle">o hacé clic para buscar archivos</span>
                </div>
                {file ? (
                  <p className="case-docs__staged">
                    Listo para subir: {file.name}
                    <button
                      type="button"
                      className="app-button app-button--secondary case-docs__unstage"
                      onClick={handleUnstageFile}
                    >
                      Quitar
                    </button>
                  </p>
                ) : null}
                <div className="case-docs__upload-row">
                  <Form.Select
                    className="case-docs__field"
                    aria-label="Tipo de documento"
                    value={typeValue}
                    onChange={(event) => setTypeValue(event.target.value)}
                  >
                    <option value="">Seleccionar tipo</option>
                    {DOCUMENT_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                  <button
                    type="submit"
                    className="app-button app-button--primary"
                    disabled={uploading}
                  >
                    {uploading ? 'Subiendo...' : 'Subir documento'}
                  </button>
                </div>
              </form>
              <div className="case-docs__generate">
                <button
                  type="button"
                  className="app-button app-button--primary"
                  disabled={generating || saving}
                  onClick={() => handleGenerate('summary')}
                >
                  {generating ? 'Generando...' : 'Generar resumen con IA'}
                </button>
                <button
                  type="button"
                  className="app-button app-button--secondary"
                  disabled={generating || saving}
                  onClick={() => handleGenerate('constancia')}
                >
                  {generating ? 'Generando...' : 'Generar constancia'}
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}

      {draft && canWrite && !isClosed ? (
        <div className="case-docs__draft">
          <h4 className="case-docs__draft-title">
            {draft.generatedByAi ? 'Borrador del resumen con IA' : 'Borrador de constancia'}
          </h4>
          <div className="case-docs__preview">
            <object data={draftObjectUrl} type="application/pdf" width="100%" height="420">
              Tu navegador no puede mostrar el PDF en esta vista.
            </object>
          </div>
          {draft.generatedByAi && draft.summaryText ? (
            <details className="case-docs__draft-summary">
              <summary>Ver texto del resumen</summary>
              <p>{draft.summaryText}</p>
            </details>
          ) : null}
          <div className="case-docs__draft-actions">
            <button
              type="button"
              className="app-button app-button--primary"
              disabled={saving}
              onClick={handleSaveDraft}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              className="app-button app-button--secondary"
              disabled={saving}
              onClick={handleDiscardDraft}
            >
              Descartar
            </button>
          </div>
          <p className="case-docs__draft-note">Nada queda guardado hasta que toques Guardar.</p>
        </div>
      ) : null}

      {loading ? (
        <SkeletonRows rows={3} />
      ) : documents.length === 0 ? (
        <EmptyState
          title="No hay documentos"
          message="Este expediente todavía no tiene documentos adjuntos."
        />
      ) : (
        <ul className="case-docs__list">
          {documents.map((doc) => {
            const docState = getDocumentState(doc);
            return (
              <li key={doc.id} className="case-docs__row">
                <div className="case-docs__info">
                  <span className="case-docs__name">
                    {doc.fileName}
                    {doc.generatedByAi ? (
                      <span className="case-docs__tag" title="Documento generado con IA">
                        IA
                      </span>
                    ) : null}
                  </span>
                  <span className="case-docs__meta">
                    {getTypeLabel(doc.type)} · {formatDate(doc.uploadDate, preferences.dateFormat)} ·{' '}
                    {formatFileSize(doc.sizeBytes)}
                  </span>
                </div>
                <div className="case-docs__actions">
                  {docState ? (
                    <span className={`cases-item__status ${docState.className} case-docs__badge`}>
                      {docState.label}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className="app-button app-button--secondary"
                    onClick={() => handleDownload(doc)}
                  >
                    Descargar
                  </button>
                  {canWrite ? (
                    <button
                      type="button"
                      className="app-button app-button--secondary case-docs__button--danger"
                      onClick={() => setPendingDelete(doc)}
                    >
                      Eliminar
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        show={Boolean(pendingDelete)}
        onHide={() => setPendingDelete(null)}
        onConfirm={handleDeleteConfirmed}
        title="Eliminar documento"
        message="¿Estás seguro que deseas eliminar el documento"
        itemName={pendingDelete?.fileName}
        confirmLabel="Sí, deseo eliminarlo"
      />
    </section>
  );
};

export default CaseDocuments;
