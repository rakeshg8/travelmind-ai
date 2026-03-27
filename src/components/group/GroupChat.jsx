import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { supabase } from "../../config/supabase";
import { useAuth } from "../../hooks/useAuth";

export default function GroupChat({ groupId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!groupId) return undefined;
    let channel;

    async function loadMessages() {
      const { data } = await supabase
        .from("messages")
        .select("*, users(name)")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true });

      setMessages(data || []);

      channel = supabase
        .channel(`group-chat-${groupId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `group_id=eq.${groupId}`,
          },
          async (payload) => {
            const newMsg = payload.new;
            const { data: userData } = await supabase
              .from("users")
              .select("name")
              .eq("id", newMsg.sender_id)
              .single();
            setMessages((current) => [
              ...current,
              { ...newMsg, users: { name: userData?.name || "Unknown" } },
            ]);
          }
        )
        .subscribe();
    }

    loadMessages();
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [groupId]);

  const send = async () => {
    if (!text.trim()) return;
    await supabase.from("messages").insert({
      group_id: groupId,
      sender_id: user.uid,
      content: text.trim(),
    });
    setText("");
  };

  return (
    <section className="space-y-3">
      <div className="glass-card h-72 space-y-2 overflow-auto p-3">
        {messages.map((msg) => (
          <div key={msg.id} className="rounded-lg bg-slate-900/70 p-2 text-sm">
            <p className="text-xs text-slate-400">{msg.users?.name || msg.sender_id}</p>
            <p>{msg.content}</p>
          </div>
        ))}
        {!messages.length ? <p className="text-sm text-slate-400">No messages yet.</p> : null}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type message..."
        />
        <button type="button" className="rounded-lg bg-accent px-3 text-primary" onClick={send}>
          <Send className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
