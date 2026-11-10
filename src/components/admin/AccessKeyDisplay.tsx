import { useState } from "react";
import { Check, Copy } from "lucide-react";

const AccessKeyDisplay = ({ accessKey, large = false }: { accessKey: string; large?: boolean }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(accessKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center gap-2 rounded-full bg-muted font-mono tracking-widest text-foreground transition hover:bg-secondary ${
        large ? "px-6 py-3 text-xl" : "px-3 py-1 text-xs"
      }`}
      aria-label={`Copy key ${accessKey}`}
    >
      {accessKey}
      {copied ? <Check size={large ? 18 : 12} className="text-primary" /> : <Copy size={large ? 18 : 12} />}
    </button>
  );
};

export default AccessKeyDisplay;
