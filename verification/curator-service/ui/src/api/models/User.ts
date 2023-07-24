export const enum Role {
    Admin = 'admin',
    Curator = 'curator',
    JuniorCurator = 'junior curator',
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
