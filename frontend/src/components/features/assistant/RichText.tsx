/** แปลง **ข้อความ** ในคำตอบของบอทให้เป็นตัวหนา (ส่วนอื่นแสดงเป็นข้อความธรรมดา) */
export default function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold text-on-surface">
            {part.slice(2, -2)}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  );
}
