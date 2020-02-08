interface Assignment {
    id: string | null;
    assigned: string[];
}

interface AssignmentPosition extends Assignment {
    x: number;
    y: number;
}
