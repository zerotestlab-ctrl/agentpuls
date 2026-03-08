/**
 * AgentPulse — Settings Modal
 * API key + chain selection with localStorage persistence
 */
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp, DEMO_API_KEY } from "@/contexts/AppContext";
import { CHAIN_LABELS, type SupportedChain } from "@/lib/agents";
import { Eye, EyeOff, ExternalLink, CheckCircle2, AlertCircle, Info, Trash2 } from "lucide-react";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const CHAINS: SupportedChain[] = ["base-mainnet", "eth-mainnet", "avalanche-mainnet"];

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { apiKey, isDemo, setAndSaveApiKey, chain, setAndSaveChain } = useApp();
  // Show empty if currently using demo key
  const [draft, setDraft] = useState(isDemo ? "" : apiKey);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setAndSaveApiKey(draft);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  };

  const handleClear = () => {
    setDraft("");
    setAndSaveApiKey("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg bg-background-card border-border-accent/40 shadow-card-elevated">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <span className="text-neon">⚙</span> Settings
          </DialogTitle>
          <DialogDescription className="text-foreground-muted">
            Configure your Covalent GoldRush API key and default chain.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Demo mode notice */}
          {isDemo && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-secondary/10 border border-secondary/20 text-xs text-secondary">
              <Info size={12} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Demo Mode Active</p>
                <p className="text-foreground-muted mt-0.5">
                  Using shared demo key — rate limited. Enter your own free key for full access.
                </p>
              </div>
            </div>
          )}

          {/* API Key */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Covalent GoldRush API Key
            </Label>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="cqt_…  (leave blank for demo mode)"
                className="bg-background-input border-border pr-20 font-mono text-sm focus:border-primary/60"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {draft && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-foreground-subtle hover:text-destructive transition-colors p-1"
                    title="Clear"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="text-foreground-muted hover:text-foreground transition-colors p-1"
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <p className="text-xs text-foreground-muted flex items-center gap-1.5">
              Free key at{" "}
              <a
                href="https://www.covalenthq.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 inline-flex items-center gap-0.5"
              >
                covalenthq.com <ExternalLink size={11} />
              </a>
              — no credit card required
            </p>

            {draft && (
              <div
                className={`flex items-center gap-1.5 text-xs ${draft.length > 10 ? "text-success" : "text-destructive"}`}
              >
                {draft.length > 10 ? (
                  <><CheckCircle2 size={12} /> Key looks valid</>
                ) : (
                  <><AlertCircle size={12} /> Key seems too short</>
                )}
              </div>
            )}
          </div>

          {/* Chain Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Default Chain
            </Label>
            <div className="flex flex-wrap gap-2">
              {CHAINS.map((c) => (
                <button
                  key={c}
                  onClick={() => setAndSaveChain(c)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                    chain === c
                      ? "bg-primary/10 border-primary/50 text-primary shadow-neon-sm"
                      : "bg-background-input border-border text-foreground-muted hover:border-border-accent"
                  }`}
                >
                  {CHAIN_LABELS[c]}
                </button>
              ))}
            </div>
          </div>

          {/* Info box */}
          <div className="rounded-lg bg-primary-dim/30 border border-primary/20 p-3 text-xs text-foreground-muted space-y-1">
            <p className="text-primary font-medium">100% Client-Side Privacy</p>
            <p>
              Your API key is stored only in your browser's localStorage. No data is
              sent to any AgentPulse server — all requests go directly to Covalent.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saved ? (
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Saved!
              </span>
            ) : (
              "Save Settings"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
