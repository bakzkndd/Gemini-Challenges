import { OriginalPost, EchoEvent } from "./inputTypes";
import Graph from 'graphology';
import louvain from 'graphology-communities-louvain';

const originalPosts: OriginalPost[] = [
    // Group A (The Echo Chamber)
    { POST_ID: 'PA1', AUTHOR_USER_ID: 'UA1', TIMESTAMP: new Date(), CONTENT_HASH: 'groupA_1' },
    { POST_ID: 'PA2', AUTHOR_USER_ID: 'UA2', TIMESTAMP: new Date(), CONTENT_HASH: 'groupA_2' },

    // Group B (The Leaky Group)
    { POST_ID: 'PB1', AUTHOR_USER_ID: 'UB1', TIMESTAMP: new Date(), CONTENT_HASH: 'groupB_1' },
    { POST_ID: 'PB2', AUTHOR_USER_ID: 'UB2', TIMESTAMP: new Date(), CONTENT_HASH: 'groupB_2' },

    // External Content Source (doesn't echo back)
    { POST_ID: 'PX1', AUTHOR_USER_ID: 'UX1', TIMESTAMP: new Date(), CONTENT_HASH: 'external_1' },
];

const echoEvents: EchoEvent[] = [
    // --- Group A ({UA1, UA2}) Interactions ---
    // High number of internal echoes
    { ECHO_ID: 'EA01', ECHOING_USER_ID: 'UA1', ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED: 'PA2', TIMESTAMP: new Date() },
    { ECHO_ID: 'EA02', ECHOING_USER_ID: 'UA1', ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED: 'PA2', TIMESTAMP: new Date() },
    { ECHO_ID: 'EA03', ECHOING_USER_ID: 'UA1', ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED: 'PA2', TIMESTAMP: new Date() },
    { ECHO_ID: 'EA04', ECHOING_USER_ID: 'UA2', ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED: 'PA1', TIMESTAMP: new Date() },
    { ECHO_ID: 'EA05', ECHOING_USER_ID: 'UA2', ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED: 'PA1', TIMESTAMP: new Date() },
    // One outgoing echo
    { ECHO_ID: 'EA06', ECHOING_USER_ID: 'UA1', ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED: 'PB1', TIMESTAMP: new Date() },

    // --- Group B ({UB1, UB2}) Interactions ---
    // Low number of internal echoes
    { ECHO_ID: 'EB01', ECHOING_USER_ID: 'UB1', ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED: 'PB2', TIMESTAMP: new Date() },
    { ECHO_ID: 'EB02', ECHOING_USER_ID: 'UB2', ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED: 'PB1', TIMESTAMP: new Date() },
    // High number of outgoing echoes to an external source
    { ECHO_ID: 'EB03', ECHOING_USER_ID: 'UB1', ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED: 'PX1', TIMESTAMP: new Date() },
    { ECHO_ID: 'EB04', ECHOING_USER_ID: 'UB1', ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED: 'PX1', TIMESTAMP: new Date() },
    { ECHO_ID: 'EB05', ECHOING_USER_ID: 'UB2', ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED: 'PX1', TIMESTAMP: new Date() },
    { ECHO_ID: 'EB06', ECHOING_USER_ID: 'UB2', ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED: 'PX1', TIMESTAMP: new Date() },
    { ECHO_ID: 'EB07', ECHOING_USER_ID: 'UB2', ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED: 'PX1', TIMESTAMP: new Date() },
];

export function mostInfluentialUsers(): string[] {
    const users = new Map<string, string[]>();
    for (let i = 0; i < originalPosts.length; i++) {
        const originalPost = originalPosts[i];
        if (!users.has(originalPost.AUTHOR_USER_ID)) {
            users.set(originalPost.AUTHOR_USER_ID, []);
        }
    }

    for (let i = 0; i < echoEvents.length; i++) {
        const echoEvent = echoEvents[i];
        if (echoEvent.ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED.startsWith('E')) {
            const user = findUser(echoEvent.ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED);
            if (user) {
                users.get(user)?.push(echoEvent.ECHO_ID);
            }
        } else {
            const originalPost = originalPosts.find(post => post.POST_ID === echoEvent.ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED);
            if (originalPost) {
                users.get(originalPost.AUTHOR_USER_ID)?.push(echoEvent.ECHO_ID);
            }
        }
    }
    //sort by amount of posts - 1
    const sortedUsers = Array.from(users).sort((a, b) => b[1].length - a[1].length);
    return sortedUsers.map(user => `${user[0]}: ${user[1].length} `);
}

export function findUser(postId: string): string | undefined {
    if (postId.startsWith('P')) {
        for (let i = 0; i < originalPosts.length; i++) {
            const post = originalPosts[i];
            if (post.POST_ID === postId) {
                return post.AUTHOR_USER_ID;
            }
        }
    } else if (postId.startsWith('E')) {
        for (let i = 0; i < echoEvents.length; i++) {
            const echo = echoEvents[i];
            if (echo.ECHO_ID === postId) {
                return findUser(echo.ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED);
            }
        }
    }
    return undefined;
}

export function echoChambers(): Array<string[]> {
    const userGraph: Map<string, Map<string, number>> = generateUserGraph();
    const graph = new Graph({ type: 'directed' })

    for (const [echoingUser, connections] of userGraph.entries()) {
        // Add the source node
        graph.mergeNode(echoingUser);

        for (const [originalAuthor, weight] of connections.entries()) {
            // Add the target node
            graph.mergeNode(originalAuthor);

            // Add the weighted, directed edge between them
            graph.addEdge(echoingUser, originalAuthor, { weight });
        }
    }
    
    louvain.assign(graph);

    const communities: { [id: number]: string[] } = {};
    graph.forEachNode((node, attributes) => {
        const communityId = attributes.community;
        if (!communities[communityId]) {
            communities[communityId] = [];
        }
        communities[communityId].push(node);
    });

    const echoChambers: Array<string[]> = [];
    for (const community of Object.values(communities)) {
        echoChambers.push(community);
    }
console.log(echoChambers)
    for (const echoChamber of echoChambers) {
        let involved = 0;
        let internal = 0;
        for (let i = 0; i < echoEvents.length; i++) {
            const echoEvent = echoEvents[i];
            const originalUser = findUser(echoEvent.ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED);
            if (originalUser) {
                if (echoChamber.includes(echoEvent.ECHOING_USER_ID)) {
                    involved++;
                    if (echoChamber.includes(originalUser)) {
                        internal++;
                    }
                }
                else if (echoChamber.includes(originalUser)) {
                    involved++;
                }
            }
        }

        if (internal / involved * 100 < 80) {
            echoChambers.splice(echoChambers.indexOf(echoChamber), 1);
        }
    }
    
    return echoChambers;
}

export function generateUserGraph() : Map<string, Map<string, number>> {
    const userGraph: Map<string, Map<string, number>> = new Map();
    for (let i = 0; i < originalPosts.length; i++) {
        const originalPost = originalPosts[i];
        if (!userGraph.has(originalPost.AUTHOR_USER_ID)) {
            userGraph.set(originalPost.AUTHOR_USER_ID, new Map());
        }
    }

    for (let i = 0; i < echoEvents.length; i++) {
        const echoEvent = echoEvents[i];
        const originalUser = findUser(echoEvent.ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED);
        if (originalUser) {
            if (!userGraph.has(originalUser)) {
                userGraph.set(originalUser, new Map());
            }
            userGraph.get(originalUser)?.set(echoEvent.ECHOING_USER_ID, (userGraph.get(originalUser)?.get(echoEvent.ECHOING_USER_ID) || 0) + 1);
        }
    }
    return userGraph;
}