import { format } from "date-fns";

interface EventData {
  titulo: string;
  descricao?: string;
  localizacao?: string;
  data_inicio: string;
  data_fim: string;
}

export function generateICSFile(event: EventData): string {
  // Converter datas para formato ICS (YYYYMMDDTHHMMSSZ)
  const formatICSDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "yyyyMMdd'T'HHmmss'Z'");
  };

  const dtstart = formatICSDate(event.data_inicio);
  const dtend = formatICSDate(event.data_fim);
  const dtstamp = format(new Date(), "yyyyMMdd'T'HHmmss'Z'");
  const uid = `${Date.now()}@obra-cert.com`;

  // Escapar caracteres especiais em strings ICS
  const escapeICS = (str: string) => {
    return str.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  };

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Obra Cert//Planejamento//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${escapeICS(event.titulo)}`,
    event.descricao ? `DESCRIPTION:${escapeICS(event.descricao)}` : "",
    event.localizacao ? `LOCATION:${escapeICS(event.localizacao)}` : "",
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter((line) => line !== "")
    .join("\r\n");

  return icsContent;
}

export function downloadICSFile(event: EventData, filename?: string) {
  const icsContent = generateICSFile(event);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename || `${event.titulo.replace(/\s+/g, "_")}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

export async function shareToCalendar(event: EventData) {
  const icsContent = generateICSFile(event);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const file = new File([blob], `${event.titulo.replace(/\s+/g, "_")}.ics`, {
    type: "text/calendar",
  });

  // Verificar se a API de compartilhamento está disponível
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: event.titulo,
        text: event.descricao || "Adicionar ao calendário",
        files: [file],
      });
      return true;
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Erro ao compartilhar:", error);
      }
      return false;
    }
  } else {
    // Fallback: fazer download do arquivo
    downloadICSFile(event);
    return true;
  }
}
