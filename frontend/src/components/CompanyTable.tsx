import { DataGrid, GridRowSelectionModel } from "@mui/x-data-grid";
import { useEffect, useState } from "react";
import { useSelectedCompanies } from "./SelectedCompaniesContext";
import { getCollectionsById, ICollection, ICompany, createCompanyCollectionAssociation, deleteCompanyCollectionAssociation } from "../utils/jam-api";
import ProgressBar from './ProgressBar';
import LinearProgress from '@mui/material/LinearProgress';

interface CompanyTableProps {
    selectedCollectionId: string;
    collectionResponse: ICollection[];
}

const CompanyTable: React.FC<CompanyTableProps> = ({ selectedCollectionId, collectionResponse }) => {
    const { selectedCompanyIds, setSelectedCompanyIds, clearSelectedCompanies } = useSelectedCompanies();
    const [response, setResponse] = useState<ICompany[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [offset, setOffset] = useState<number>(0);
    const [pageSize, setPageSize] = useState(25);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [totalCompaniesInCollection, setTotalCompaniesInCollection] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [selectingAll, setSelectingAll] = useState<boolean>(false);
    const [estimatedTime, setEstimatedTime] = useState<string | null>(null);

    const targetCollection = collectionResponse.filter(collection => collection.id !== selectedCollectionId);
    const currentCollection = collectionResponse.filter(collection => collection.id === selectedCollectionId);

    const fetchCompanies = async () => {
        const newResponse = await getCollectionsById(selectedCollectionId, offset, pageSize);
        setResponse(newResponse.companies);
        setTotal(newResponse.total);
        setTotalCompaniesInCollection(newResponse.total);
    };

    useEffect(() => {
        fetchCompanies();
    }, [selectedCollectionId, offset, pageSize]);

    useEffect(() => {
        setOffset(0);
        setSelectedCompanyIds([]);
        setSuccessMessage(null);
        setErrorMessage(null);
    }, [selectedCollectionId]);

    const handleRowSelectionChange = (newSelection: GridRowSelectionModel) => {
        const newSelectedIds = new Set(selectedCompanyIds);

        response.forEach(company => {
            if (newSelection.includes(company.id)) {
                newSelectedIds.add(company.id);
            } else {
                newSelectedIds.delete(company.id);
            }
        });

        setSelectedCompanyIds(Array.from(newSelectedIds));
    };

    const handlePageChange = (newPage: number) => {
        setOffset(newPage * pageSize);
    };

    const handleSelectAll = async () => {
        setSelectingAll(true);
        setProgress(0);
        setEstimatedTime(null);

        try {
            const totalCompaniesToFetch = totalCompaniesInCollection;
            const chunkSize = 15000;
            const allIds = [];

            for (let offset = 0; offset < totalCompaniesToFetch; offset += chunkSize) {
                const allCompaniesResponse = await getCollectionsById(selectedCollectionId, offset, chunkSize);
                const ids = allCompaniesResponse.companies.map(company => company.id);
                allIds.push(...ids);
            }

            setSelectedCompanyIds(allIds);
            setProgress(100);
        } catch (error) {
            console.error("Error fetching all companies:", error);
        } finally {
            setSelectingAll(false);
        }
    };

    const handleDeselectAll = () => {
        setSelectedCompanyIds([]);
    };

    const handleMoveTo = async () => {
        setLoading(true);
        setProgress(0);
        setEstimatedTime(null);
        setErrorMessage(null);

        try {
            const totalCompaniesToMove = selectedCompanyIds.length;
            const chunkSize = 10;
            const successfulResults = [];

            const startTime = Date.now();

            for (let i = 0; i < totalCompaniesToMove; i += chunkSize) {
                const chunk = selectedCompanyIds.slice(i, i + chunkSize);

                const associations = chunk.map(companyId => ({
                    company_id: Number(companyId),
                    collection_id: targetCollection[0].id,
                }));

                const results = await createCompanyCollectionAssociation(associations);

                if (results.length === 0) {
                    setErrorMessage("A company cannot be moved to another collection if it is already exists in there.");
                    return;
                }

                successfulResults.push(...results);

                const currentProgress = Math.min(100, Math.floor(((i + chunk.length) / totalCompaniesToMove) * 100));
                setProgress(currentProgress);

                const elapsedTime = Date.now() - startTime;
                const timePerCompany = elapsedTime / (i + chunk.length);
                const remainingCompanies = totalCompaniesToMove - (i + chunk.length);
                const estimatedRemainingTime = Math.floor(remainingCompanies * timePerCompany / 1000);

                const minutes = Math.floor(estimatedRemainingTime / 60);
                const seconds = estimatedRemainingTime % 60;
                setEstimatedTime(`${minutes}m ${seconds}s`);
            }

            const totalSuccess = successfulResults.every(result => result !== null && result !== undefined);

            if (totalSuccess) {
                const addedCount = selectedCompanyIds.length;
                clearSelectedCompanies();
                setSuccessMessage(addedCount === 1
                    ? '1 company added successfully!'
                    : `${addedCount} companies added successfully!`
                );
                await fetchCompanies();
            } else {
                console.error('Some associations were not created:', successfulResults);
            }
        } catch (error) {
            console.error('Error creating associations:', error);
        } finally {
            setLoading(false);
            setProgress(100);
            setEstimatedTime(null);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        setProgress(0);
        setErrorMessage(null);

        try {
            const totalCompaniesToDelete = selectedCompanyIds.length;
            const chunkSize = 10; // Adjust based on your preference
            const successfulResults = [];

            for (let i = 0; i < totalCompaniesToDelete; i += chunkSize) {
                const chunk = selectedCompanyIds.slice(i, i + chunkSize);

                // Delete company associations
                const results = await deleteCompanyCollectionAssociation(chunk.map(id => ({ company_id: Number(id), collection_id: selectedCollectionId })));

                successfulResults.push(...results);
                const currentProgress = Math.min(100, Math.floor(((i + chunk.length) / totalCompaniesToDelete) * 100));
                setProgress(currentProgress);
            }

            const totalSuccess = successfulResults.every(result => result !== null && result !== undefined);

            if (totalSuccess) {
                const deletedCount = selectedCompanyIds.length;
                clearSelectedCompanies();
                setSuccessMessage(deletedCount === 1
                    ? '1 company deleted successfully!'
                    : `${deletedCount} companies deleted successfully!`
                );
                await fetchCompanies();
            } else {
                setErrorMessage("Some companies could not be deleted.");
                console.error('Some deletions were not successful:', successfulResults);
            }
        } catch (error) {
            console.error('Error deleting companies:', error);
            setErrorMessage("An error occurred while deleting companies.");
        } finally {
            setLoading(false);
            setProgress(100);
        };
    };

    const buttonText = targetCollection.length > 0 ? `Add ${selectedCompanyIds.length} to ${targetCollection[0].collection_name}` : "No target collection";
    const deleteButtonText = currentCollection.length > 0 ? `Delete ${selectedCompanyIds.length} from ${currentCollection[0].collection_name}` : "No current collection";

    const handleCloseSuccessMessage = () => {
        setSuccessMessage(null);
    };

    const handleCloseErrorMessage = () => {
        setErrorMessage(null);
    };

    const allSelected = selectedCompanyIds.length === totalCompaniesInCollection;

    return (
        <div style={{ height: 800, width: "100%" }}>
            {selectingAll && <LinearProgress />}
            {loading && !selectingAll && (
                <>
                    <ProgressBar progress={progress} />
                    {estimatedTime && <div className="estimated-time">Estimated time remaining: {estimatedTime}</div>}
                </>
            )}
            <DataGrid
                rows={response}
                rowHeight={30}
                columns={[
                    { field: "liked", headerName: "Liked", width: 90 },
                    { field: "id", headerName: "ID", width: 90 },
                    { field: "company_name", headerName: "Company Name", width: 200 },
                ]}
                initialState={{
                    pagination: {
                        paginationModel: { page: 0, pageSize: 25 },
                    },
                }}
                rowCount={total}
                pagination
                checkboxSelection
                paginationMode="server"
                onPaginationModelChange={(newMeta) => {
                    setPageSize(newMeta.pageSize);
                    handlePageChange(newMeta.page);
                }}
                rowSelectionModel={selectedCompanyIds as (string | number)[]}
                onRowSelectionModelChange={handleRowSelectionChange}
            />
            {successMessage && (
                <div className="mt-4 p-2 bg-green-500 text-white rounded flex justify-between items-center">
                    <span>{successMessage}</span>
                    <button
                        onClick={handleCloseSuccessMessage}
                        className="ml-4 text-white hover:text-gray-200 text-xs"
                    >
                        &times;
                    </button>
                </div>
            )}
            {errorMessage && (
                <div className="mt-4 p-2 bg-red-500 text-white rounded flex justify-between items-center">
                    <span>{errorMessage}</span>
                    <button
                        onClick={handleCloseErrorMessage}
                        className="ml-4 text-white hover:text-gray-200 text-xs"
                    >
                        &times;
                    </button>
                </div>
            )}
            <div className="button-group mt-4">
                {allSelected && totalCompaniesInCollection > 0 ? (
                    <button
                        onClick={handleDeselectAll}
                        className="py-2 px-4 bg-red-500 text-white font-semibold rounded mr-4"
                    >
                        Deselect All
                    </button>
                ) : (
                    totalCompaniesInCollection > 0 && (
                        <button
                            onClick={handleSelectAll}
                            className="py-2 px-4 bg-blue-500 text-white font-semibold rounded mr-4"
                        >
                            Select All
                        </button>
                    )
                )}
                <button
                    onClick={handleMoveTo}
                    className={`py-2 px-4 text-white font-semibold rounded mr-4 ${
                        selectedCompanyIds.length > 0
                            ? "bg-orange-500 hover:bg-orange-600"
                            : "bg-gray-400 cursor-not-allowed opacity-50"
                    }`}
                    disabled={selectedCompanyIds.length === 0}
                >
                    {buttonText}
                </button>
                <button
                    onClick={handleDelete}
                    className={`py-2 px-4 text-white font-semibold rounded ${
                        selectedCompanyIds.length > 0
                            ? "bg-red-500 hover:bg-red-600"
                            : "bg-gray-400 cursor-not-allowed opacity-50"
                    }`}
                    disabled={selectedCompanyIds.length === 0}
                >
                    {deleteButtonText}

                </button>
            </div>
        </div>
    );
};

export default CompanyTable;
