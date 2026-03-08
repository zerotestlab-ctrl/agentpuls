/**
 * AgentLens — Embed Code Snippet Generator Modal
 */
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { CHAIN_LABELS } from "@/lib/agents";
import { Copy, CheckCircle2 } from "lucide-react";

interface EmbedModalProps {
  open: boolean;
  onClose: () => void;
}

export function EmbedModal({ open, onClose }: EmbedModalProps) {
  const { chain } = useApp();
  const [copied, setCopied] = useState(false);

  const widgetUrl = `https://agentlens.app/widget?chain=${chain}`;
  const snippet = `<!-- AgentLens Widget — ${CHAIN_LABELS[chain]} AI Agent Analytics -->
<iframe
  src="${widgetUrl}"
  width="100%"
  height="420"
  style="border:none;border-radius:12px;overflow:hidden;"
  title="AgentLens — On-Chain AI Agent Performance"
  loading="lazy"
></iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl bg-background-card border-border-accent/40 shadow-card-elevated">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-neon">{"</>"}</span> Embed Widget
          </DialogTitle>
          <DialogDescription className="text-foreground-muted">
            Paste this snippet into any website to embed the AgentLens mini widget
            showing live {CHAIN_LABELS[chain]} agent analytics.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <pre className="bg-background-input border border-border rounded-lg p-4 text-xs font-mono text-foreground-muted overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
            {snippet}
          </pre>

          <div className="flex items-center justify-between">
            <p className="text-xs text-foreground-subtle">
              Widget shows live data — chain: {CHAIN_LABELS[chain]}
            </p>
            <Button
              onClick={handleCopy}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
            >
              {copied ? (
                <>
                  <CheckCircle2 size={13} /> Copied!
                </>
              ) : (
                <>
                  <Copy size={13} /> Copy Code
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
