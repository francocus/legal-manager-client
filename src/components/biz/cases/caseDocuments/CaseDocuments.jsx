import { useCallback, useEffect, useState } from 'react';
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
  const [workingDocId, setWorkingDocId] = useState(null);
  const [typeValue, setTypeValue] = useState('');
  const [file, setFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [pendingDelete, setPendingDelete] = useState(null);

  const canWrite = isSysadmin(currentUser?.role) || isLawyer(currentUser?.role);
  const isClosed = String(legalCase?.status ?? '').toLowerCase() === 'cerrado';

  const loadDocuments = useCallback(async () => {
    if (!legalCase?.id) return;
    setLoading(true);
    try {
      setDocuments(await documentsApi.getAll(legalCase.id));
    } catch (error) {
      showToast({ variant: 'danger', message: error.message });
    } finally {
      setLoading(false);
    }
  }, [legalCase?.id, showToast]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
  };

  const resetForm = () => {
    setTypeValue('');
    setFile(null);
    // Remounting the input clears the browser-held selection as well.
    setFileInputKey((key) => key + 1);
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!typeValue || !file) {
      showToast({ variant: 'warning', message: 'Este campo es obligatorio.' });
      return;
    }

    const looksLikePdf =
      file.type === 'application/pdf' || String(file.name ?? '').toLowerCase().endsWith('.pdf');
    if (!looksLikePdf) {
      showToast({ variant: 'warning', message: 'Solo se aceptan archivos PDF.' });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      showToast({ variant: 'warning', message: 'El archivo supera el tamaño máximo permitido (10 MB).' });
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

  const handleGenerateAiSummary = async () => {
    setGenerating(true);
    try {
      await documentsApi.generateAiSummary(legalCase.id);
      showToast({ variant: 'info', message: 'Resumen generado: revisalo y decidí si lo guardás o lo descartás.' });
      await loadDocuments();
    } catch (error) {
      showToast({ variant: 'danger', message: error.message });
    } finally {
      setGenerating(false);
    }
  };

  const handleReview = async (doc, decision) => {
    setWorkingDocId(doc.id);
    try {
      if (decision === 'approve') {
        await documentsApi.approve(doc.id);
        showToast({ variant: 'success', message: 'Resumen guardado como documento del expediente.' });
      } else {
        await documentsApi.discard(doc.id);
        showToast({ variant: 'success', message: 'Resumen descartado.' });
      }
      await loadDocuments();
    } catch (error) {
      showToast({ variant: 'danger', message: error.message });
    } finally {
      setWorkingDocId(null);
    }
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
            <form className="case-docs__form" onSubmit={handleUpload}>
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
              <Form.Control
                key={fileInputKey}
                className="case-docs__field case-docs__file"
                type="file"
                accept="application/pdf,.pdf"
                aria-label="Archivo PDF (hasta 10 MB)"
                onChange={handleFileChange}
              />
              <button type="submit" className="app-button app-button--primary" disabled={uploading}>
                {uploading ? 'Subiendo...' : 'Subir documento'}
              </button>
            </form>
          )}
          <button
            type="button"
            className="app-button app-button--primary"
            disabled={generating}
            onClick={handleGenerateAiSummary}
          >
            {generating ? 'Generando...' : 'Generar resumen con IA'}
          </button>
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
                  {canWrite && doc.isPendingReview ? (
                    <>
                      <button
                        type="button"
                        className="app-button app-button--primary"
                        disabled={workingDocId === doc.id}
                        onClick={() => handleReview(doc, 'approve')}
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        className="app-button app-button--secondary"
                        disabled={workingDocId === doc.id}
                        onClick={() => handleReview(doc, 'discard')}
                      >
                        Descartar
                      </button>
                    </>
                  ) : null}
                  <button
                    type="button"
                    className="app-button app-button--secondary"
                    disabled={workingDocId === doc.id}
                    onClick={() => handleDownload(doc)}
                  >
                    Descargar
                  </button>
                  {canWrite ? (
                    <button
                      type="button"
                      className="app-button app-button--secondary case-docs__button--danger"
                      disabled={workingDocId === doc.id}
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
