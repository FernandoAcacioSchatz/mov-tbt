import { useEditMode, type SectionKey } from '../../hooks/useEditMode';

export function EditButton({ section }: { section: SectionKey }) {
  const { enabled, open } = useEditMode();
  if (!enabled) return null;
  return (
    <button type="button" className="editbtn" onClick={() => open(section)} aria-label={`Editar seção ${section}`}>
      ✎ Editar
    </button>
  );
}
