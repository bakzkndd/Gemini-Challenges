import { OriginalPost, EchoEvent } from "./inputTypes";
import Graph from 'graphology';
import louvain from 'graphology-communities-louvain';

const originalPosts: OriginalPost[] = [
    { POST_ID: 'P-OTHER', AUTHOR_USER_ID: 'U-OTHER', TIMESTAMP: new Date(), CONTENT_HASH: 'other' },
    { POST_ID: 'P-MAIN', AUTHOR_USER_ID: 'U-AUTHOR', TIMESTAMP: new Date(), CONTENT_HASH: 'main_post' }
];

const echoEvents: EchoEvent[] = [
    // A simple echo of the other post, just to ensure it's ignored
    { ECHO_ID: 'E0', ECHOING_USER_ID: 'U1', ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED: 'P-OTHER', TIMESTAMP: new Date() },

    // --- Start of the main echo chains from P-MAIN ---

    // Path 1: A deep chain (A -> B -> C)
    { ECHO_ID: 'E1', ECHOING_USER_ID: 'U-DEEP-A', ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED: 'P-MAIN', TIMESTAMP: new Date() },
    { ECHO_ID: 'E2', ECHOING_USER_ID: 'U-DEEP-B', ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED: 'E1', TIMESTAMP: new Date() },
    { ECHO_ID: 'E3', ECHOING_USER_ID: 'U-DEEP-C', ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED: 'E2', TIMESTAMP: new Date() },

    // Path 2: A chain that branches out
    { ECHO_ID: 'E4', ECHOING_USER_ID: 'U-BRANCH-ROOT', ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED: 'P-MAIN', TIMESTAMP: new Date() },
    { ECHO_ID: 'E5', ECHOING_USER_ID: 'U-BRANCH-A', ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED: 'E4', TIMESTAMP: new Date() },
    { ECHO_ID: 'E6', ECHOING_USER_ID: 'U-BRANCH-B', ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED: 'E4', TIMESTAMP: new Date() },

    // Path 3: A simple, short chain (dead end)
    { ECHO_ID: 'E7', ECHOING_USER_ID: 'U-SHORT', ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED: 'P-MAIN', TIMESTAMP: new Date() }
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

export function tracePaths(postId: string): Array<string[]> {
    const paths: Array<string[]> = [];

    for (let i = 0; i < echoEvents.length; i++) {
        if (echoEvents[i].ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED === postId) {
            const trace = tracePaths(echoEvents[i].ECHO_ID);
            if (trace.length > 0) {
                for (let j = 0; j < trace.length; j++) {
                    paths.push([postId, ...trace[j]]);
                }
            } else {
                paths.push([postId, echoEvents[i].ECHO_ID]);
            }
        }
    }

    return paths;
}