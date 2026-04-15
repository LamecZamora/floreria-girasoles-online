import { useState, useCallback, useEffect } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";

function generateChallenge() {
  const ops = ["+", "-", "×"] as const;
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a: number, b: number, answer: number;

  switch (op) {
    case "+":
      a = Math.floor(Math.random() * 20) + 1;
      b = Math.floor(Math.random() * 20) + 1;
      answer = a + b;
      break;
    case "-":
      a = Math.floor(Math.random() * 20) + 5;
      b = Math.floor(Math.random() * a) + 1;
      answer = a - b;
      break;
    case "×":
      a = Math.floor(Math.random() * 10) + 1;
      b = Math.floor(Math.random() * 10) + 1;
      answer = a * b;
      break;
  }

  return { question: `${a} ${op} ${b}`, answer };
}

interface CaptchaChallengeProps {
  onVerified: (verified: boolean) => void;
}

const CaptchaChallenge = ({ onVerified }: CaptchaChallengeProps) => {
  const [challenge, setChallenge] = useState(generateChallenge);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");

  const refresh = useCallback(() => {
    setChallenge(generateChallenge());
    setInput("");
    setStatus("idle");
    onVerified(false);
  }, [onVerified]);

  useEffect(() => {
    if (input === "") {
      setStatus("idle");
      onVerified(false);
      return;
    }
    const parsed = parseInt(input, 10);
    if (isNaN(parsed)) return;
    if (parsed === challenge.answer) {
      setStatus("correct");
      onVerified(true);
    } else if (input.length >= String(challenge.answer).length) {
      setStatus("wrong");
      onVerified(false);
    }
  }, [input, challenge.answer, onVerified]);

  return (
    <div className={`rounded-xl border p-3 sm:p-4 transition-all duration-300 ${
      status === "correct"
        ? "border-secondary/50 bg-secondary/5"
        : status === "wrong"
        ? "border-destructive/50 bg-destructive/5"
        : "border-border bg-muted/30"
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className={`h-4 w-4 ${status === "correct" ? "text-secondary" : "text-muted-foreground"}`} />
        <span className="text-xs font-medium text-muted-foreground">Verificación de seguridad</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-card rounded-lg px-3 py-2 border border-border/50 select-none">
          <span className="font-mono text-lg font-bold text-foreground tracking-wider">{challenge.question}</span>
          <span className="text-muted-foreground font-bold">=</span>
        </div>
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          value={input}
          onChange={(e) => setInput(e.target.value.replace(/[^0-9-]/g, ""))}
          placeholder="?"
          className="w-20 text-center font-mono text-lg font-bold py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          aria-label="Respuesta del captcha"
        />
        <button
          type="button"
          onClick={refresh}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Nueva operación"
          title="Cambiar operación"
        >
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      {status === "wrong" && (
        <p className="text-xs text-destructive mt-2">Respuesta incorrecta, intenta de nuevo</p>
      )}
      {status === "correct" && (
        <p className="text-xs text-secondary mt-2 flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" /> Verificación completada
        </p>
      )}
    </div>
  );
};

export default CaptchaChallenge;
