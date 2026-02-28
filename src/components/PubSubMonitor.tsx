import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { useConnectionStore } from "../stores/connectionStore";

interface PublishedMessage {
  id: string;
  channel: string;
  message: string;
  timestamp: Date;
  subscribers: number;
}

export function PubSubMonitor({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const getActiveConnection = useConnectionStore((state) => state.getActiveConnection);
  const [channels, setChannels] = useState<string[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [publishedMessages, setPublishedMessages] = useState<PublishedMessage[]>([]);
  const [inputChannel, setInputChannel] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [loadingChannels, setLoadingChannels] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadChannels = async () => {
    const config = getActiveConnection();
    if (!config) return;

    setLoadingChannels(true);
    try {
      const result = await invoke<string[]>("getPublicChannels", { config });
      setChannels(result);
    } catch (error) {
      console.error("Failed to load channels:", error);
    } finally {
      setLoadingChannels(false);
    }
  };

  const handlePublish = async () => {
    if (!inputChannel.trim() || !inputMessage.trim()) return;

    const config = getActiveConnection();
    if (!config) {
      alert("No active connection");
      return;
    }

    try {
      const subscribers = await invoke<number>("publishMessage", {
        config,
        channel: inputChannel,
        message: inputMessage,
      });

      const newMessage: PublishedMessage = {
        id: crypto.randomUUID(),
        channel: inputChannel,
        message: inputMessage,
        timestamp: new Date(),
        subscribers,
      };

      setPublishedMessages((prev) => [...prev, newMessage]);
      setInputMessage("");
    } catch (error) {
      console.error("Failed to publish message:", error);
      alert("Failed to publish message. Check your connection.");
    }
  };

  const handleSubscribe = async (channel: string) => {
    setSelectedChannel(channel);
    setPublishedMessages([]);
  };

  const handleUnsubscribe = () => {
    setSelectedChannel(null);
    setPublishedMessages([]);
  };

  useEffect(() => {
    if (isOpen) {
      loadChannels();
    }
  }, [isOpen, loadChannels]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [publishedMessages]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative z-50 h-[700px] w-full max-w-6xl rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Pub/Sub Monitor</h2>
          <Button onClick={loadChannels} disabled={loadingChannels} variant="outline">
            {loadingChannels ? "Loading..." : "Refresh Channels"}
          </Button>
        </div>

        <div className="flex gap-6">
          <div className="w-1/3 space-y-4">
            <Card className="p-4">
              <h3 className="mb-4 text-lg font-medium">Active Channels</h3>
              <div className="space-y-2">
                {loadingChannels ? (
                  <div className="text-center text-sm text-zinc-500">Loading...</div>
                ) : channels.length === 0 ? (
                  <div className="text-center text-sm text-zinc-500">No active channels</div>
                ) : (
                  channels.map((channel) => (
                    <button
                      key={channel}
                      onClick={() => handleSubscribe(channel)}
                      className={`w-full rounded border p-2 text-left text-sm ${
                        selectedChannel === channel
                          ? "border-blue-600 bg-blue-950 text-blue-300"
                          : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-900"
                      }`}
                    >
                      {channel}
                    </button>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="mb-4 text-lg font-medium">Publish Message</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="pub-channel">Channel</Label>
                  <Input
                    id="pub-channel"
                    value={inputChannel}
                    onChange={(e) => setInputChannel(e.target.value)}
                    placeholder="channel-name"
                  />
                </div>
                <div>
                  <Label htmlFor="pub-message">Message</Label>
                  <textarea
                    id="pub-message"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Enter message..."
                    className="h-24 w-full rounded border border-zinc-800 bg-zinc-950 p-2 text-sm text-zinc-300 focus:border-zinc-700 focus:outline-none"
                  />
                </div>
                <Button onClick={handlePublish} className="w-full">
                  Publish
                </Button>
              </div>
            </Card>
          </div>

          <div className="flex-1">
            <Card className="h-full p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  {selectedChannel
                    ? `Subscribed to: ${selectedChannel}`
                    : "Select a channel to monitor"}
                </h3>
                {selectedChannel && (
                  <Button onClick={handleUnsubscribe} variant="outline" size="sm">
                    Unsubscribe
                  </Button>
                )}
              </div>

              <div className="h-[530px] overflow-y-auto rounded border border-zinc-800 bg-zinc-950 p-4">
                {selectedChannel ? (
                  <div className="space-y-3">
                    {publishedMessages.length === 0 ? (
                      <div className="text-center text-sm text-zinc-500">
                        No messages yet. Published messages will appear here.
                      </div>
                    ) : (
                      publishedMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className="rounded border border-zinc-800 bg-zinc-900 p-3"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs text-zinc-500">{msg.channel}</span>
                            <span className="text-xs text-zinc-500">
                              {msg.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="mb-2 text-sm text-zinc-300">{msg.message}</div>
                          <div className="text-xs text-zinc-500">
                            Delivered to {msg.subscribers} subscriber
                            {msg.subscribers !== 1 ? "s" : ""}
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                    Select a channel from the list or publish to a new channel
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
