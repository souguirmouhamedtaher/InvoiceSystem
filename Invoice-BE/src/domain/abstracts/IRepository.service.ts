export abstract class IRepository<T> {
    abstract getAll(): Promise<T[]>;
    abstract get(id: any): Promise<T | null>;

    abstract count(query?: any): Promise<number>;

    abstract findByAttribute(attribute: string, value: any): Promise<T | null>;

    abstract findAllByAttribute(attribute: string, value: any): Promise<T[] | null>;

    abstract findAllByAttributeWithFilter(query: any, page: number, limit: number, sort?: any): Promise<T[] | null>;

    abstract create(item: T): Promise<T>;

    abstract update(id: string, item: Partial<T>): Promise<T | null>;

    abstract delete(id: string): Promise<boolean>;

    abstract aggregate(pipeline: object[]): Promise<T[]>;

}