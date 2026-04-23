"use client"
import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { getUnreadNotificationCount, getNotifications, markNotificationsAsRead } from "@/actions/notifications"
import Link from "next/link"

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    // Initial fetch
    getUnreadNotificationCount().then(setUnreadCount);

    // Simple polling every 30s
    const interval = setInterval(() => {
      getUnreadNotificationCount().then(setUnreadCount);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOpen = async () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      const data = await getNotifications();
      setNotifications(data);
      if (unreadCount > 0) {
        await markNotificationsAsRead();
        setUnreadCount(0);
      }
    }
  };

  return (
    <div className="relative z-50">
      <button 
        onClick={handleOpen}
        className="relative flex items-center justify-center w-9 h-9 rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl shadow-lg z-50 overflow-hidden flex flex-col max-h-[400px]">
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/50">
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">Notifications</h3>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  No notifications yet.
                </div>
              ) : (
                notifications.map(notif => (
                  <Link 
                    key={notif.id} 
                    href={notif.ideaId ? `/idea/${notif.ideaId}` : '#'}
                    onClick={() => setIsOpen(false)}
                    className={`block px-3 py-3 rounded-lg transition-colors hover:bg-zinc-100 dark:hover:bg-white/5 ${notif.read ? 'opacity-70' : 'bg-blue-50/50 dark:bg-blue-500/5'}`}
                  >
                    <div className="flex gap-3">
                      <div className="shrink-0 pt-0.5">
                        {notif.actor?.image ? (
                          <img src={notif.actor.image} alt="" className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500">{notif.actor?.name?.charAt(0) || 'U'}</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-tight">
                          <span className="font-semibold">{notif.actor?.name || 'A user'}</span> {notif.content}
                        </p>
                        {notif.idea?.title && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate">"{notif.idea.title}"</p>
                        )}
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 uppercase tracking-wider">
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
