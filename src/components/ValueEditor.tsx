import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "./ui/dialog";
import { useConnectionStore } from "../stores";
import {
  getString,
  setString,
  hashGetAll,
  hashSet,
  listRange,
  setMembers,
  zsetRange,
  type SortedSetMember,
} from "../lib/api";

interface ValueEditorProps {
  isOpen: boolean;
  onClose: () => void;
  key: string;
  keyType: string;
}

export function ValueEditor({ isOpen, onClose, key, keyType }: ValueEditorProps) {
  const activeConnection = useConnectionStore((state) => state.getActiveConnection());
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);
  const [viewMode, setViewMode] = useState<"edit" | "json" | "raw">("edit");

  useEffect(() => {
    if (!isOpen || !activeConnection) return;

    const loadValue = async () => {
      setLoading(true);
      try {
        switch (keyType) {
          case "string":
            const strVal = await getString(activeConnection, key);
            setValue(strVal || "");
            break;
          case "hash":
            const hashVal = await hashGetAll(activeConnection, key);
            setValue(JSON.stringify(hashVal, null, 2));
            break;
          case "list":
            const listVal = await listRange(activeConnection, key, 0, -1);
            setValue(JSON.stringify(listVal, null, 2));
            break;
          case "set":
            const setVal = await setMembers(activeConnection, key);
            setValue(JSON.stringify(setVal, null, 2));
            break;
          case "zset":
            const zsetVal = await zsetRange(activeConnection, key, 0, -1, true);
            setValue(JSON.stringify(zsetVal, null, 2));
            break;
          default:
            setValue("");
        }
      } catch (error) {
        console.error("Failed to load value:", error);
      } finally {
        setLoading(false);
      }
    };

    loadValue();
  }, [isOpen, key, keyType, activeConnection]);

  const handleSave = async () => {
    if (!activeConnection) return;

    setLoading(true);
    try {
      if (keyType === "string") {
        await setString(activeConnection, key, value);
      } else if (keyType === "hash") {
        const fields = JSON.parse(value) as Record<string, string>;
        for (const [field, fieldValue] of Object.entries(fields)) {
          await hashSet(activeConnection, key, field, fieldValue);
        }
      }
      setSaved(true);
      setTimeout(() => {
        onClose();
        setSaved(false);
        setValue("");
      }, 500);
    } catch (error) {
      console.error("Failed to save value:", error);
      alert("Failed to save value. Please check the format.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogHeader>
        <DialogTitle>Edit Value</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Key</Label>
            <Input value={key} disabled className="font-mono" />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Input value={keyType.toUpperCase()} disabled />
          </div>

          {keyType !== "string" && (
            <div className="space-y-2">
              <Label>View Mode</Label>
              <div className="flex space-x-2">
                {(["edit", "json", "raw"] as const).map((mode) => (
                  <Button
                    key={mode}
                    size="sm"
                    variant={viewMode === mode ? "default" : "outline"}
                    onClick={() => setViewMode(mode)}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Value</Label>
            <textarea
              className="flex h-64 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={loading}
              placeholder="Enter value..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || saved}>
            {loading ? "Saving..." : saved ? "Saved!" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
