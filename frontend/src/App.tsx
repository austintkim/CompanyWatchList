import "./App.css";

import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useEffect, useState } from "react";
import CompanyTable from "./components/CompanyTable";
import { getCollectionsMetadata } from "./utils/jam-api";
import useApi from "./utils/useApi";
import { SelectedCompaniesProvider } from "./components/SelectedCompaniesContext";
import { Select } from "@mui/material";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

function App() {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>();
  const { data: collectionResponse } = useApi(() => getCollectionsMetadata());

  useEffect(() => {
    setSelectedCollectionId(collectionResponse?.[0]?.id);
  }, [collectionResponse]);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <SelectedCompaniesProvider>
      <div className="mx-8">
        <div className="font-bold text-xl border-b p-2 mb-4 text-left">
          CompanyWatchList
        </div>
        <div className="flex">
          <div className="w-1/5">
            <p className=" font-bold border-b pb-2">Collections</p>
            <div className="flex flex-col gap-2">
              {collectionResponse?.map((collection) => {
                return (
                  <div
                    key = {collection.id}
                    className={`py-1 hover:cursor-pointer hover:bg-orange-300 ${
                      selectedCollectionId === collection.id &&
                      "bg-orange-500 font-bold"
                    }`}
                    onClick={() => {
                      setSelectedCollectionId(collection.id);
                    }}
                  >
                    {collection.collection_name}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="w-4/5 ml-4">
            {selectedCollectionId && (
              <CompanyTable
              selectedCollectionId={selectedCollectionId}
              collectionResponse = {collectionResponse || []}
              />
            )}
          </div>
        </div>
      </div>
    </SelectedCompaniesProvider>
  </ThemeProvider>
  );
}

export default App;
