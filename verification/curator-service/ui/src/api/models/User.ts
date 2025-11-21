export const enum Role {
    Admin = 'admin',
    Curator = 'curator',
    JuniorCurator = 'junior curator',
    PendingResearcher = 'pending researcher',
    Researcher = 'researcher',
}

export interface User {
    id: string;
    name?: string;
    email: string;
    googleID: string;
    roles: Role[];
    picture?: string;
    newsletterAccepted?: boolean;
    apiKey?: string;
}
