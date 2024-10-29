## High-Level Approach:

- The goal is to add/delete a company from one list to another (and vice versa) by creating/deleting a row in the `company_collection_associations` table, associating the company with the other collection.

- Backend:
  - A `create` endpoint was added, which uses batch processing, minimal database queries, and bulk inserts.
  - This allows handling multiple association objects (i.e., multiple companies being selected to be added to the other list) in a single request.
  - This approach helps optimize performance and reduce latency.

- Frontend:
  - A global context, `selectedCompanyIds`, was added to ensure that selections persist across page changes.
  - `handleRowSelectionChange` allows users to select or deselect individual companies.
  - `handleSelectAll` enables users to select all companies in the collection efficiently in batches, avoiding overwhelming the `get_company_collection_by_id` backend endpoint.
  - `handleMoveTo` processes the selected companies in chunks, creating associations with the target collection.
  - Progress bars and estimated time for remaining operations provide users with visual feedback during loading operations.
  - A success message indicates how many companies were added to the target collection, which can then be dismissed.

## Assumptions/Tradeoffs

### Assumptions:
- Duplicates are not allowed (i.e., if a user tries to add a company already in both lists, the operation will not happen).
- Loading companies in big batches (i.e., 15,000) won’t cause significant performance degradation.
- The code assumes there is only one target collection available for association (i.e., only one other list).
- Due to time constraints of this assessment, error handling is not as robust as it could be; the code focuses on the happy-path.

### Tradeoffs:
- By allowing users to select large numbers of companies (e.g., all 50K in a list), we trade off performance for flexibility.
  - Fetching large datasets may result in longer load times or potential timeouts if the backend becomes overstretched.
- The dashboard provides immediate feedback (e.g., estimated time left to move companies), which improves user experience but could increase the load on the API if many users perform actions simultaneously.
- A smaller chunk size was chosen for moving companies to provide gradual progress updates, though this may increase the total time for larger operations.
  - The throttle ensures each insertion has a 0.1-second delay (meaning 50,000 insertions could take at least 5,000 seconds), but the focus is on user experience.

## Next Steps

- **Better error handling:**
  - Provide more feedback to users when errors occur during API calls (e.g., network errors, server issues).
  - Implement a retry mechanism for failed requests.

- **Enhance processing performance:**
  - Experiment with different chunk sizes for moving large sets of companies.

- **User Experience:**
  - Implement notifications and asynchronous processing so users can continue using other parts of the application or not have to be at their screen to know if all selected companies have been moved.
