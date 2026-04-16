import { useState, useCallback, useEffect } from "react";
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

interface CaptchaChallengeProps {
  onVerified: (verified: boolean) => void;
}

const CaptchaChallenge = ({ onVerified }: CaptchaChallengeProps) => {
  const [challenge, setChallenge] = useState(generateChallenge);
  const [input, setInput] = useState("");
  const [verified, setVerified] = useState(false);

  const refresh = useCallback(() => {
    setChallenge(generateChallenge());
    setInput("");
    setVerified(false);
    onVerified(false);
  }, [onVerified]);

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
      <div className="flex items-center gap-2 mb-2">
        <div className={`h-5 w-5 rounded-full flex items-center justify-center transition-colors duration-300 ${
          verified ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
        }`}>
          {verified ? <Check className="h-3 w-3" /> : <span className="text-[10px] font-bold">?</span>}
        </div>
        <span className={`text-xs font-medium transition-colors ${verified ? "text-green-600" : "text-muted-foreground"}`}>
          {verified ? "Verificado" : "Resuelve para continuar"}
        </span>
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
          disabled={verified}
          className={`w-20 text-center font-mono text-lg font-bold py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 ${
            verified
              ? "border-green-500 bg-green-500/10 text-green-700 cursor-not-allowed"
              : "border-border bg-background text-foreground focus:ring-primary/50"
          }`}
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
    </div>
  );
};

export default CaptchaChallenge;
