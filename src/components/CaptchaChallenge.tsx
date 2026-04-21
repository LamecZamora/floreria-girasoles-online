import { useState, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import { RefreshCw, Check } from "lucide-react";

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

export interface CaptchaHandle {
  refresh: () => void;
}

interface CaptchaChallengeProps {
  onVerified: (verified: boolean) => void;
}

const CaptchaChallenge = forwardRef<CaptchaHandle, CaptchaChallengeProps>(({ onVerified }, ref) => {
  const [challenge, setChallenge] = useState(generateChallenge);
  const [input, setInput] = useState("");
  const [verified, setVerified] = useState(false);

  const refresh = useCallback(() => {
    setChallenge(generateChallenge());
    setInput("");
    setVerified(false);
    onVerified(false);
  }, [onVerified]);

  useImperativeHandle(ref, () => ({ refresh }), [refresh]);

  useEffect(() => {
    if (input === "") {
      setVerified(false);
      onVerified(false);
      return;
    }
    const parsed = parseInt(input, 10);
    if (isNaN(parsed)) return;
    if (parsed === challenge.answer) {
      setVerified(true);
      onVerified(true);
    } else {
      setVerified(false);
      onVerified(false);
    }
  }, [input, challenge.answer, onVerified]);

  return (
    <div className={`rounded-xl border p-3 transition-colors duration-300 ${
      verified
        ? "border-green-500 bg-green-500/10"
        : "border-border bg-muted/30"
    }`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`h-5 w-5 rounded-full flex items-center justify-center transition-colors duration-300 flex-shrink-0 ${
            verified ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
          }`}>
            {verified ? <Check className="h-3 w-3" /> : <span className="text-[10px] font-bold">?</span>}
          </div>
          <span className={`text-xs font-medium transition-colors truncate ${verified ? "text-green-600" : "text-muted-foreground"}`}>
            {verified ? "Verificado" : "Resuelve para continuar"}
          </span>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
          aria-label="Nueva operación"
          title="Cambiar operación"
        >
          <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2 bg-card rounded-lg px-2.5 sm:px-3 py-2 border border-border/50 select-none flex-1 min-w-0 justify-center">
          <span className="font-mono text-base sm:text-lg font-bold text-foreground tracking-wider">{challenge.question}</span>
          <span className="text-muted-foreground font-bold">=</span>
        </div>
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          value={input}
          onChange={(e) => setInput(e.target.value.replace(/[^0-9-]/g, ""))}
          placeholder="?"
          disabled={verified}
          className={`w-16 sm:w-20 text-center font-mono text-base sm:text-lg font-bold py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 ${
            verified
              ? "border-green-500 bg-green-500/10 text-green-700 cursor-not-allowed"
              : "border-border bg-background text-foreground focus:ring-primary/50"
          }`}
          aria-label="Respuesta del captcha"
        />
      </div>
    </div>
  );
});

CaptchaChallenge.displayName = "CaptchaChallenge";

export default CaptchaChallenge;
