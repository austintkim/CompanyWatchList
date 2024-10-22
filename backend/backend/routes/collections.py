import uuid

from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.db import database
from backend.routes.companies import (
    CompanyBatchOutput,
    fetch_companies_with_liked,
)

router = APIRouter(
    prefix="/collections",
    tags=["collections"],
)

class CompanyCollectionAssociationInput(BaseModel):
    company_id: int
    collection_id: uuid.UUID

class CompanyCollectionAssociationOutput(BaseModel):
    id: int
    company_id: int
    collection_id: uuid.UUID

class CompanyCollectionMetadata(BaseModel):
    id: uuid.UUID
    collection_name: str


class CompanyCollectionOutput(CompanyBatchOutput, CompanyCollectionMetadata):
    pass


@router.get("", response_model=list[CompanyCollectionMetadata])
def get_all_collection_metadata(
    db: Session = Depends(database.get_db),
):
    collections = db.query(database.CompanyCollection).all()

    return [
        CompanyCollectionMetadata(
            id=collection.id,
            collection_name=collection.collection_name,
        )
        for collection in collections
    ]


@router.get("/{collection_id}", response_model=CompanyCollectionOutput)
def get_company_collection_by_id(
    collection_id: uuid.UUID,
    offset: int = Query(
        0, description="The number of items to skip from the beginning"
    ),
    limit: int = Query(10, description="The number of items to fetch"),
    db: Session = Depends(database.get_db),
):
    query = (
        db.query(database.CompanyCollectionAssociation, database.Company)
        .join(database.Company)
        .filter(database.CompanyCollectionAssociation.collection_id == collection_id)
    )

    total_count = query.with_entities(func.count()).scalar()

    results = query.offset(offset).limit(limit).all()
    companies = fetch_companies_with_liked(db, [company.id for _, company in results])

    return CompanyCollectionOutput(
        id=collection_id,
        collection_name=db.query(database.CompanyCollection)
        .get(collection_id)
        .collection_name,
        companies=companies,
        total=total_count,
    )

@router.post("", response_model=list[CompanyCollectionAssociationOutput])
def create_batch_company_collection_associations(
    payload: list[CompanyCollectionAssociationInput],
    db: Session = Depends(database.get_db)
):
    company_ids = {item.company_id for item in payload}
    collection_ids = {item.collection_id for item in payload}

    companies = db.query(database.Company).filter(database.Company.id.in_(company_ids)).all()
    company_map = {company.id: company for company in companies}

    collections = db.query(database.CompanyCollection).filter(database.CompanyCollection.id.in_(collection_ids)).all()
    collection_map = {collection.id: collection for collection in collections}

    for company_id in company_ids:
        if company_id not in company_map:
            raise HTTPException(status_code=404, detail=f"Company with ID {company_id} not found")

    for collection_id in collection_ids:
        if collection_id not in collection_map:
            raise HTTPException(status_code=404, detail=f"Collection with ID {collection_id} not found")

    existing_associations = db.query(database.CompanyCollectionAssociation).filter(
        (database.CompanyCollectionAssociation.company_id.in_(company_ids)) &
        (database.CompanyCollectionAssociation.collection_id.in_(collection_ids))
    ).all()
    existing_set = {(assoc.company_id, assoc.collection_id) for assoc in existing_associations}

    associations_to_create = [
        database.CompanyCollectionAssociation(
            company_id=item.company_id, collection_id=item.collection_id
        )
        for item in payload
        if (item.company_id, item.collection_id) not in existing_set
    ]

    if associations_to_create:
        db.bulk_save_objects(associations_to_create)
        db.commit()

        created_associations = db.query(database.CompanyCollectionAssociation).filter(
            (database.CompanyCollectionAssociation.company_id.in_(company_ids)) &
            (database.CompanyCollectionAssociation.collection_id.in_(collection_ids))
        ).all()

    else:
        created_associations = []

    return [
        CompanyCollectionAssociationOutput(
            id=association.id,
            company_id=association.company_id,
            collection_id=association.collection_id
        )
        for association in created_associations
    ]

@router.delete("", response_model=list[CompanyCollectionAssociationOutput])
def delete_batch_company_collection_associations(
    payload: list[CompanyCollectionAssociationInput],
    db: Session = Depends(database.get_db)
):
    associations_to_delete = set()

    for item in payload:
        associations_to_delete.add((item.company_id, item.collection_id))

    existing_associations = db.query(database.CompanyCollectionAssociation).filter(
        (database.CompanyCollectionAssociation.company_id.in_(item.company_id for item in payload)) &
        (database.CompanyCollectionAssociation.collection_id.in_(item.collection_id for item in payload))
    ).all()

    deleted_associations = []

    for association in existing_associations:
        if (association.company_id, association.collection_id) in associations_to_delete:
            db.delete(association)
            deleted_associations.append(association)

    db.commit()

    return [  
        CompanyCollectionAssociationOutput(
            id=association.id,
            company_id=association.company_id,
            collection_id=association.collection_id
        )
        for association in deleted_associations
    ]
