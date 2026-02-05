import { ClientSession, Model, PipelineStage, Types } from "mongoose";
import { IRepository } from "../../../../domain/abstracts";

export class MongoGenericRepository<T> implements IRepository<T> {
    private _repository: Model<T>;
    private _populateOnFind: string[];

    constructor(repository: Model<T>, populateOnFind: any[] = []) {
        this._repository = repository;
        this._populateOnFind = populateOnFind;
    }

    async aggregate(pipeline: PipelineStage[]): Promise<T[]> {
        return await this._repository
            .aggregate(pipeline)
            .exec();
    }

    async transaction<R>(
        callback: (session: ClientSession) => Promise<R>
    ): Promise<R> {
        const session = await this._repository.db.startSession();
        session.startTransaction();

        try {
            const result = await callback(session);
            await session.commitTransaction();
            return result;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async getAll(): Promise<T[]> {
        const query = { deletedAt: null } as any;
        return await this._repository
            .find(query)
            .populate(this._populateOnFind)
            .exec();
    }

    async get(id: any): Promise<any> {
        const query = { _id: id, deletedAt: null } as any;
        return await this._repository
            .findOne(query)
            .populate(this._populateOnFind)
            .exec();
    }

    async count(query?: any): Promise<number> {

        return await this._repository.countDocuments(query || {});
    }

    async findByAttribute(attribute: string, value: any): Promise<any> {
        const query = { [attribute]: value, deletedAt: null } as any;

        return await this._repository
            .findOne(query)
            .populate(this._populateOnFind)
            .exec();
    }

    async findAllByAttribute(attribute: string, value: any): Promise<T[]> {
        const query = { [attribute]: value, deletedAt: null } as any;

        return await this._repository
            .find(query)
            .populate(this._populateOnFind)
            .exec();
    }

    async findAllByAttributeWithFilter(query: any, page: number, limit: number, sort?: any): Promise<T[] | null> {
        return await this._repository
            .find(query)
            .sort(sort || {})
            .skip((page - 1) * limit)
            .limit(limit)
            .populate(this._populateOnFind)
            .exec();
    }

    async create(item: T): Promise<T> {

        return await this._repository.create(item);
    }

    async update(id: string, item: T) {
        const query = { _id: id } as any;

        return await this._repository.findOneAndUpdate(query, item, {
            returnOriginal: false,
        });
    }

    //soft delete
    async delete(id: string): Promise<boolean> {
        const query = { _id: id } as any;


        // Update both isDeleted and deletedAt fields
        const result = await this._repository.findOneAndUpdate(query, {
            $set: {
                isDeleted: true, // Mark the user as deleted
                deletedAt: new Date() // Set the deletion timestamp
            }
        });

        return result ? true : false;
    }

}