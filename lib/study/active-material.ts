const activeMaterialKey = "masterme:active-material";

export function getActiveMaterialId(materialIds: string[]) {
  if (typeof window === "undefined") return "";
  const saved = window.localStorage.getItem(activeMaterialKey);
  return saved && materialIds.includes(saved) ? saved : "";
}

export function saveActiveMaterialId(materialId: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(activeMaterialKey, materialId);
  }
}
