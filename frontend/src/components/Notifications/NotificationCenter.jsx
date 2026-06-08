import { useEffect, useMemo, useState } from "react";
import { FaBell } from "react-icons/fa";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../utils/api";
import { formatDate } from "../../utils/formatters";

const getSocketUrl = () =>
  (import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1").replace(
    /\/api\/v1\/?$/,
    ""
  );

const NotificationCenter = ({ isAuthorized }) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const latestNotifications = useMemo(
    () => notifications.slice(0, 8),
    [notifications]
  );

  useEffect(() => {
    if (!isAuthorized) {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }

    let mounted = true;

    const loadNotifications = async () => {
      try {
        const { data } = await api.get("/notifications");
        if (!mounted) return;
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } catch (error) {
        toast.error(getErrorMessage(error, "Unable to load notifications."));
      }
    };

    loadNotifications();

    const socket = io(getSocketUrl(), {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("notification:new", (notification) => {
      setNotifications((current) => [notification, ...current]);
      setUnreadCount((current) => current + 1);
      toast(notification.title);
    });

    return () => {
      mounted = false;
      socket.disconnect();
    };
  }, [isAuthorized]);

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to update notifications."));
    }
  };

  if (!isAuthorized) return null;

  return (
    <div className="relative">
      <button
        type="button"
        className="relative inline-flex rounded-lg p-2 text-slate-700 hover:bg-slate-100"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open notifications"
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-[min(360px,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white shadow-soft">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-bold text-slate-950">Notifications</h3>
            <button
              type="button"
              className="text-xs font-semibold text-brand-700 hover:text-brand-900"
              onClick={markAllRead}
            >
              Mark all read
            </button>
          </div>
          {latestNotifications.length === 0 ? (
            <div className="p-4 text-sm text-slate-600">No notifications yet.</div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {latestNotifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`border-b border-slate-100 px-4 py-3 ${
                    notification.read ? "bg-white" : "bg-brand-50/50"
                  }`}
                >
                  <p className="text-sm font-bold text-slate-950">
                    {notification.title}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-slate-600">
                    {notification.message}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {formatDate(notification.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
