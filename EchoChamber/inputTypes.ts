export type OriginalPost = {
    POST_ID: string;
    AUTHOR_USER_ID: string;
    TIMESTAMP: Date;
    CONTENT_HASH: string;
}

export type EchoEvent = {
    ECHO_ID: string;
    ECHOING_USER_ID: string;
    ORIGINAL_POST_ID_OR_ECHO_ID_BEING_ECHOED: string;
    TIMESTAMP: Date;
}