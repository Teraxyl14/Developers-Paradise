"use client"
import { useState, useTransition, useRef, useEffect } from "react"
import { sendMessage } from "@/actions/messages"
import { Send, Loader2, User, MessageCircle } from "lucide-react"

export function InboxView({ initialMessages, currentUserId, defaultContact, defaultContext }: { 
  initialMessages: any[], 
  currentUserId: string,
  defaultContact: any,
  defaultContext: any
}) {
  const [messages, setMessages] = useState(initialMessages);
  
  // Group messages by contact
  const groupedConversations = new Map<string, any>();
  
  messages.forEach(m => {
     const otherUser = m.senderId === currentUserId ? m.receiver : m.sender;
     if (!groupedConversations.has(otherUser.id)) {
        groupedConversations.set(otherUser.id, {
           contact: otherUser,
           latestMsg: m,
           thread: [m]
        });
     } else {
        const existing = groupedConversations.get(otherUser.id);
        existing.thread.push(m);
        existing.latestMsg = m;
     }
  });

  if (defaultContact && !groupedConversations.has(defaultContact.id)) {
      groupedConversations.set(defaultContact.id, {
          contact: defaultContact,
          latestMsg: null,
          thread: [],
          initialContext: defaultContext
      });
  }

  const contacts = Array.from(groupedConversations.values()).sort((a, b) => {
      if (!a.latestMsg) return -1;
      if (!b.latestMsg) return 1;
      return new Date(b.latestMsg.createdAt).getTime() - new Date(a.latestMsg.createdAt).getTime();
  });

  const initialActive = defaultContact ? defaultContact.id : (contacts.length > 0 ? contacts[0].contact.id : null);
  const [activeContactId, setActiveContactId] = useState<string | null>(initialActive);

  const activeData = activeContactId ? groupedConversations.get(activeContactId) : null;
  const activeThread = activeData?.thread || [];
  
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
     bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread]);

  const handleSend = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!content.trim() || !activeContactId) return;

     const msgContent = content;
     const ctxId = activeData?.initialContext?.id;
     setContent("");

     // Optimistic update
     const optMsg = {
        id: 'temp-' + Date.now(),
        senderId: currentUserId,
        receiverId: activeContactId,
        content: msgContent,
        createdAt: new Date().toISOString(),
        idea: ctxId ? activeData.initialContext : null,
        sender: { id: currentUserId, name: 'You' },
        receiver: activeData.contact
     };
     setMessages([...messages, optMsg]);

     startTransition(async () => {
         await sendMessage(activeContactId, msgContent, ctxId);
         // Rely on next fetch or revalidation to replace temp ID
     });
  };

  return (
    <>
      <div className="w-full md:w-1/3 border-r border-zinc-200 dark:border-white/10 flex flex-col h-full bg-zinc-50/50 dark:bg-transparent">
         <div className="p-4 border-b border-zinc-200 dark:border-white/10 font-semibold text-zinc-900 dark:text-white bg-white dark:bg-zinc-900/50">
             Conversations
         </div>
         <div className="flex-1 overflow-y-auto">
             {contacts.length === 0 ? (
                 <div className="p-8 text-center text-sm text-zinc-500">No messages yet. Match with a co-founder to start chatting!</div>
             ) : (
                 contacts.map((c: any) => (
                    <button 
                       key={c.contact.id} 
                       onClick={() => setActiveContactId(c.contact.id)}
                       className={`w-full text-left p-4 border-b border-zinc-200 dark:border-white/5 transition-colors flex items-center gap-3 ${activeContactId === c.contact.id ? 'bg-blue-50 dark:bg-white/5' : 'hover:bg-zinc-100 dark:hover:bg-white/5'}`}
                    >
                       <div className="shrink-0 w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                          {c.contact.image ? <img src={c.contact.image} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-zinc-500" />}
                       </div>
                       <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-zinc-900 dark:text-white truncate">{c.contact.name || 'Developer'}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                             {c.latestMsg ? c.latestMsg.content : 'New match'}
                          </p>
                       </div>
                    </button>
                 ))
             )}
         </div>
      </div>

      <div className="flex-1 flex flex-col h-full relative">
         {activeData ? (
            <>
               <div className="p-4 border-b border-zinc-200 dark:border-white/10 font-semibold text-zinc-900 dark:text-white flex items-center gap-3 bg-white dark:bg-zinc-900/50">
                  <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                     {activeData.contact.image ? <img src={activeData.contact.image} alt="" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-zinc-500" />}
                  </div>
                  {activeData.contact.name || 'Developer'}
               </div>

               <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {activeData.initialContext && activeThread.length === 0 && (
                      <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 p-4 rounded-xl text-sm text-blue-900 dark:text-blue-300 text-center mx-auto max-w-sm mb-6">
                         Send a message to discuss: <strong>{activeData.initialContext.title}</strong>
                      </div>
                  )}

                  {activeThread.map((msg: any) => {
                     const isMe = msg.senderId === currentUserId;
                     return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                           <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-sm'}`}>
                              {msg.content}
                           </div>
                           {msg.idea && !isMe && (
                              <p className="text-[10px] text-zinc-400 mt-1 opacity-70">Re: {msg.idea.title}</p>
                           )}
                        </div>
                     )
                  })}
                  <div ref={bottomRef} />
               </div>

               <div className="p-4 border-t border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/50">
                  <form onSubmit={handleSend} className="flex gap-2">
                     <input 
                       type="text" 
                       value={content}
                       onChange={(e) => setContent(e.target.value)}
                       placeholder="Message..." 
                       disabled={isPending}
                       className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-full px-4 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                     />
                     <button 
                       type="submit" 
                       disabled={isPending || !content.trim()}
                       className="bg-blue-600 hover:bg-blue-700 text-white w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 transition-colors shadow-sm shrink-0"
                     >
                       {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 -ml-0.5" />}
                     </button>
                  </form>
               </div>
            </>
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 bg-zinc-50/30 dark:bg-transparent">
                <MessageCircle className="w-12 h-12 mb-4 opacity-20" />
                <p>Select a conversation or find a co-founder on the Discover feed.</p>
            </div>
         )}
      </div>
    </>
  )
}
