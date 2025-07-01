import { OriginalPost, EchoEvent } from "./inputTypes";

const originalPosts: OriginalPost[] = [
    { POST_ID: 'P1', AUTHOR_USER_ID: 'U101', TIMESTAMP: new Date('2025-07-01T10:00:00Z'), CONTENT_HASH: 'aaa111' },
    { POST_ID: 'P2', AUTHOR_USER_ID: 'U201', TIMESTAMP: new Date('2025-07-01T10:05:00Z'), CONTENT_HASH: 'bbb222' },
    { POST_ID: 'P3', AUTHOR_USER_ID: 'U102', TIMESTAMP: new Date('2025-07-01T10:10:00Z'), CONTENT_HASH: 'ccc333' },
    { POST_ID: 'P4', AUTHOR_USER_ID: 'U301', TIMESTAMP: new Date('2025-07-01T11:00:00Z'), CONTENT_HASH: 'ddd444' },
    { POST_ID: 'P5', AUTHOR_USER_ID: 'U201', TIMESTAMP: new Date('2025-07-01T12:00:00Z'), CONTENT_HASH: 'eee555' }
];
const echoEvents: EchoEvent[] = [
    { ECHO_ID: 'E1', ECHOING_USER_ID: 'U102', ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED: 'P1', TIMESTAMP: new Date('2025-07-01T10:15:00Z') },
    { ECHO_ID: 'E2', ECHOING_USER_ID: 'U103', ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED: 'E1', TIMESTAMP: new Date('2025-07-01T10:30:00Z') },
    { ECHO_ID: 'E3', ECHOING_USER_ID: 'U101', ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED: 'P3', TIMESTAMP: new Date('2025-07-01T10:35:00Z') },
    { ECHO_ID: 'E4', ECHOING_USER_ID: 'U301', ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED: 'P2', TIMESTAMP: new Date('2025-07-01T10:40:00Z') },
    { ECHO_ID: 'E5', ECHOING_USER_ID: 'U302', ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED: 'E4', TIMESTAMP: new Date('2025-07-01T11:10:00Z') },
    { ECHO_ID: 'E6', ECHOING_USER_ID: 'U101', ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED: 'E2', TIMESTAMP: new Date('2025-07-01T11:15:00Z') },
    { ECHO_ID: 'E7', ECHOING_USER_ID: 'U401', ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED: 'P2', TIMESTAMP: new Date('2025-07-01T11:20:00Z') },
    { ECHO_ID: 'E8', ECHOING_USER_ID: 'U103', ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED: 'P3', TIMESTAMP: new Date('2025-07-01T11:45:00Z') },
    { ECHO_ID: 'E9', ECHOING_USER_ID: 'U302', ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED: 'P4', TIMESTAMP: new Date('2025-07-01T12:05:00Z') },
    { ECHO_ID: 'E10', ECHOING_USER_ID: 'U102', ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED: 'P5', TIMESTAMP: new Date('2025-07-01T12:10:00Z') },
    { ECHO_ID: 'E11', ECHOING_USER_ID: 'U401', ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED: 'P5', TIMESTAMP: new Date('2025-07-01T12:12:00Z') }
];

export function mostInfluentialUsers(): string[] {
    const users = new Map<string, string[]>();
    for (let i = 0; i < echoEvents.length; i++) {
        const echoEvent = echoEvents[i];
        if (echoEvent.ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED.startsWith('E')) {
            const originalEcho = echoEvents.find(e => e.ECHO_ID === echoEvent.ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED);
            if (originalEcho) {
                let found = false;
                for (const user of users) {
                    if (user[1].includes(originalEcho.ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED)) {
                        if (!user[1].includes(echoEvent.ECHO_ID)) {
                            user[1].push(echoEvent.ECHO_ID);
                        }
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    users.set("", [echoEvent.ECHO_ID, echoEvent.ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED]);
                }
            }
        } else {
            const originalPost = originalPosts.find(post => post.POST_ID === echoEvent.ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED);
            if (originalPost) {
                let found = false;
                for (const user of users) {
                    if (user[1].includes(echoEvent.ECHO_ID)) {
                        user[0] = originalPost.AUTHOR_USER_ID;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    users.set(originalPost.AUTHOR_USER_ID, [echoEvent.ECHO_ID, originalPost.POST_ID]);
                }
            }
        }
    }
    //sort by amount of posts - 1
    const sortedUsers = Array.from(users).sort((a, b) => b[1].length - a[1].length);
    return sortedUsers.map(user => `${user[0]}: ${user[1].length - 1} `);
}