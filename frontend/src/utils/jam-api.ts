import axios from 'axios';

export interface ICompany {
    id: number;
    company_name: string;
    liked: boolean;
}

export interface ICollection {
    id: string;
    collection_name: string;
    companies: ICompany[];
    total: number;
}

export interface ICompanyBatchResponse {
    companies: ICompany[];
}

export interface ICompanyCollectionAssociationInput {
    company_id: number;
    collection_id: string;
}

export interface ICompanyCollectionAssociationOutput {
    id: number;
    company_id: number;
    collection_id: string;
}

// New interface for delete request
export interface ICompanyCollectionAssociationDeleteInput {
    company_id: number;
    collection_id: string;
}

const BASE_URL = 'http://localhost:8000';

export async function getCompanies(offset?: number, limit?: number): Promise<ICompanyBatchResponse> {
    try {
        const response = await axios.get(`${BASE_URL}/companies`, {
            params: {
                offset,
                limit,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching companies:', error);
        throw error;
    }
}

export async function getCollectionsById(id: string, offset?: number, limit?: number): Promise<ICollection> {
    try {
        const response = await axios.get(`${BASE_URL}/collections/${id}`, {
            params: {
                offset,
                limit,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching companies:', error);
        throw error;
    }
}

export async function getCollectionsMetadata(): Promise<ICollection[]> {
    try {
        const response = await axios.get(`${BASE_URL}/collections`);
        return response.data;
    } catch (error) {
        console.error('Error fetching companies:', error);
        throw error;
    }
}

export async function createCompanyCollectionAssociation(
    payload: ICompanyCollectionAssociationInput[]
): Promise<ICompanyCollectionAssociationOutput[]> {
    try {
        const response = await axios.post(`${BASE_URL}/collections`, payload);
        return response.data;
    } catch (error) {
        console.error('Error creating company-collection association:', error);
        throw error;
    }
}

export async function deleteBatchCompanyCollectionAssociations(
    payload: ICompanyCollectionAssociationDeleteInput[]
): Promise<ICompanyCollectionAssociationOutput[]> {
    try {
        const response = await axios.delete(`${BASE_URL}/collections`, {
            data: payload,
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting company-collection associations:', error);
        throw error;
    }
}
