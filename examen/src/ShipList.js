import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Button } from 'primereact/button'
import { FilterMatchMode } from 'primereact/api'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
// import { SERVER } from "./global";

function ShipList(props){
    const navigate = useNavigate()

    const [isDialogShown, setIsDialogShown] = useState(false)
    const [ships, setShips] = useState([])
    const [name, setName] = useState('')
    const [displacement, setDisplacement] = useState('')
    const [isNewRecord, setIsNewRecord] = useState(true)
    const [count, setCount] = useState(0)
    const [sortField, setSortField] = useState('')
    const [sortOrder, setSortOrder] = useState(1)
    const [selectedShip, setSelectedShip] = useState(null)
    const [filterString, setFilterString] = useState('')
    const [filters, setFilters] = useState({
        name: { value: null, matchMode: FilterMatchMode.CONTAINS },
        displacement: { value: null, matchMode: FilterMatchMode.EQUALS }

    })

    const [page, setPage] = useState(0)
    const [first, setFirst] = useState(0)

    const SERVER = "http://localhost:3030"
    
    const getShips = async (filterString, page, pageSize, sortField, sortOrder) => {
        const response = await fetch(`${SERVER}/ships?${filterString}&sortField=${sortField || ''}&sortOrder=${sortOrder || ''}&page=${page || ''}&pageSize=${pageSize || ''}`)
        const data = await response.json()
        setShips(data.records)
        console.log(data.records)
        setCount(data.count)
    }

    const addShip = async (ship) => {
        console.log('ship: ' + ship.name + ' ' + ship.displacement)
        await fetch(`${SERVER}/ships`, {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ship)
        })
        getShips(filterString, page, 2, sortField, sortOrder)
    }

    const editShip = async (ship) => {
        console.log(ship);
        await fetch(`${SERVER}/ships/${ship.selectedShip}`, {
            method: 'put',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ship)
        })
        getShips(filterString, page, 2, sortField, sortOrder)
    }

    const deleteShip = async (ship) => {
        await fetch(`${SERVER}/ships/${ship}`, {
            method: 'delete',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        getShips(filterString, page, 2, sortField, sortOrder)
    }

    useEffect(() => {
        getShips(filterString, page, 2, sortField, sortOrder)
    }, [filterString, page, sortField, sortOrder])

    const handleFilter = (evt) => {
        const oldFilters = filters
        oldFilters[evt.field] = evt.constraints.constraints[0]
        console.log(oldFilters);
        setFilters({ ...oldFilters })
    }

    useEffect(() => {
        const keys = Object.keys(filters)
        const computedFilterString = keys.map(e => {
            return {
                key: e,
                value: filters[e].value
            }
        }).filter(e => e.value).map(e => `${e.key}=${e.value}`).join('&')
        setFilterString(computedFilterString)
    }, [filters])

    
    const handleFilterClear = (evt) => {
        setFilters({
            name: { value: null, matchMode: FilterMatchMode.CONTAINS },
            displacement: { value: null, matchMode: FilterMatchMode.EQUALS }
        })
    }

    const handleAddClick = (ev) => {
        setIsDialogShown(true)
        setIsNewRecord(true)
        setName('')
        setDisplacement('')
    }

    const handleSaveClick = () => {
        if(isNewRecord){
            addShip({name, displacement})
        }else{
            editShip({selectedShip,name, displacement})
        }
        setIsDialogShown(false)
        setSelectedShip(null)
        setName('')
        setDisplacement('')
    }

    const tableFooter = (
        <div>
            <Button label='Add' icon='pi pi-plus' onClick={handleAddClick} />
        </div>
    )

    const dialogFooter = (
        <div>
            <Button label='Save' icon='pi pi-save' onClick={handleSaveClick} />
        </div>
    )

    const handleEditShip = (rowData) => {
        setSelectedShip(rowData.shipID)
        setName(rowData.name)
        setDisplacement(rowData.displacement)       
        setIsDialogShown(true)
        setIsNewRecord(false)
      }

    const handleDelete = (rowData) => {
        setSelectedShip(rowData.shipID)
        deleteShip(rowData.shipID)
    }

    const opsColumn = (rowData) => {
        return (
            <>
                <Button label='Edit' icon='pi pi-pencil' onClick={()=>handleEditShip(rowData)}/>
                <Button label='Delete' icon='pi pi-times' className='p-button p-button-danger' onClick={()=>handleDelete(rowData)} />
                <Button label='CrewMembers' className='p-button p-button-success' onClick={() => navigate(`/${rowData.shipID}/crewmembers`)} />
            </>
        )
    }

    const handlePageChange = (evt) => {
        setPage(evt.page)
        setFirst(evt.page * 2)
    }

    const handleSort = (evt) => {
        console.warn(evt)
        setSortField(evt.sortField)
        setSortOrder(evt.sortOrder)
    }

    const hideDialog = () => {
        setIsDialogShown(false)
    }

    return (
        <div style={{"display": "grid"}}>
            <DataTable
                value={ships}
                footer={tableFooter}
                lazy
                paginator
                onPage={handlePageChange}
                first={first}
                rows={2}
                totalRecords={count}
                onSort={handleSort}
                sortField={sortField}
                sortOrder={sortOrder}
            >
                <Column header='Name' field='name' filter filterField='name' filterPlaceholder='filter by name' onFilterApplyClick={handleFilter} onFilterClear={handleFilterClear} sortable />
                <Column header='Displacement' field='displacement' filter filterField='displacement' filterPlaceholder='filter by displacement' onFilterApplyClick={handleFilter} onFilterClear={handleFilterClear} sortable />
                <Column body={opsColumn} />
            </DataTable>
            <Dialog header='A Ship' visible={isDialogShown} onHide={hideDialog} footer={dialogFooter}>
                <div>
                    <InputText placeholder='Name' onChange={(evt) =>  setName(evt.target.value)} value={name} />
                </div>
                <div>
                    <InputText placeholder='Displacement' onChange={(evt) => setDisplacement(evt.target.value)} value={displacement} />
                </div>
            </Dialog>

        </div>

    );
}

export default ShipList;