const USERS_KEY = 'barcostop-users';
const TRIPS_KEY = 'barcostop-trips';
const RESERVATIONS_KEY = 'barcostop-reservations';
const MESSAGES_KEY = 'barcostop-messages';
const CONVERSATIONS_KEY = 'barcostop-conversations';
const CURRENT_USER_KEY = 'barcostop-current-user';
export const getUsers = () => {
    if (typeof window === 'undefined')
        return [];
    try {
        const stored = localStorage.getItem(USERS_KEY);
        const parsed = stored ? JSON.parse(stored) : [];
        return parsed.map((u) => {
            if (u._id && !u.id)
                return { id: String(u._id), ...u };
            return u;
        });
    }
    catch {
        return [];
    }
};
export const saveUsers = (users) => {
    if (typeof window === 'undefined')
        return;
    // Ensure stored users have `id` property (not `_id`)
    const normalized = users.map((u) => {
        const anyU = u;
        if (anyU._id && !anyU.id)
            anyU.id = String(anyU._id);
        return anyU;
    });
    localStorage.setItem(USERS_KEY, JSON.stringify(normalized));
};
export const getUserById = (id) => {
    const users = getUsers();
    return users.find(u => u.id === id) || null;
};
export const getTrips = () => {
    if (typeof window === 'undefined')
        return [];
    try {
        const stored = localStorage.getItem(TRIPS_KEY);
        const parsed = stored ? JSON.parse(stored) : [];
        return parsed.map((t) => {
            if (t._id && !t.id)
                return { id: String(t._id), ...t };
            return t;
        });
    }
    catch {
        return [];
    }
};
export const saveTrips = (trips) => {
    if (typeof window === 'undefined')
        return;
    const normalized = trips.map((t) => {
        const anyT = t;
        if (anyT._id && !anyT.id)
            anyT.id = String(anyT._id);
        return anyT;
    });
    localStorage.setItem(TRIPS_KEY, JSON.stringify(normalized));
};
export const getTripById = (id) => {
    const trips = getTrips();
    return trips.find(t => t.id === id) || null;
};
export const getReservations = () => {
    if (typeof window === 'undefined')
        return [];
    try {
        const stored = localStorage.getItem(RESERVATIONS_KEY);
        return stored ? JSON.parse(stored) : [];
    }
    catch {
        return [];
    }
};
export const saveReservations = (reservations) => {
    if (typeof window === 'undefined')
        return;
    localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(reservations));
};
export const getMessages = () => {
    if (typeof window === 'undefined')
        return [];
    try {
        const stored = localStorage.getItem(MESSAGES_KEY);
        return stored ? JSON.parse(stored) : [];
    }
    catch {
        return [];
    }
};
export const saveMessages = (messages) => {
    if (typeof window === 'undefined')
        return;
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
};
export const getConversations = () => {
    if (typeof window === 'undefined')
        return [];
    try {
        const stored = localStorage.getItem(CONVERSATIONS_KEY);
        return stored ? JSON.parse(stored) : [];
    }
    catch {
        return [];
    }
};
export const saveConversations = (conversations) => {
    if (typeof window === 'undefined')
        return;
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
};
export const getCurrentUser = () => {
    if (typeof window === 'undefined')
        return null;
    try {
        const stored = localStorage.getItem(CURRENT_USER_KEY);
        if (!stored)
            return null;
        const u = JSON.parse(stored);
        if (u._id && !u.id)
            return { id: String(u._id), ...u };
        return u;
    }
    catch {
        return null;
    }
};
export const saveCurrentUser = (user) => {
    if (typeof window === 'undefined')
        return;
    if (user) {
        const anyU = user;
        if (anyU._id && !anyU.id)
            anyU.id = String(anyU._id);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(anyU));
    }
    else {
        localStorage.removeItem(CURRENT_USER_KEY);
    }
};
