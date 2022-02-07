import {useParams} from 'react-router-dom'
import React, {useState, useEffect} from 'react';
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
// import { SERVER } from "./global";

function CrewMemberList(props) {
    
    // shipID
    const {id} = useParams()
    const SERVER = "http://localhost:3030"
    
    const [isDialogShown, setIsDialogShown] = useState(false)
    const [crewMembers, setCrewMembers] = useState([])
    const [name, setName] = useState('')
    const [role, setRole] = useState('')
    const [selectedMember, setSelectedMember] = useState(null)
    const [isNewRecord, setIsNewRecord] = useState(true)

    const getCrewMembers = async () => {
        const response = await fetch(`${SERVER}/ships/${id}/crewmembers`)
        const data = await response.json()
        setCrewMembers(data)
    }

    
    const addCrewMember = async (crewMember) => {
        await fetch(`${SERVER}/ships/${id}/crewmembers`, {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(crewMember)
        })
        getCrewMembers()
    }

    const editCrewMember = async (crewMember) => {
        await fetch(`${SERVER}/ships/${id}/crewmembers/${crewMember.selectedMember}`, {
            method: 'put',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(crewMember)
        })
        getCrewMembers()
    }

    const deleteCrewMember = async (crewMember) => {
        await fetch(`${SERVER}/ships/${id}/crewmembers/${crewMember}`, {
            method: 'delete',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        getCrewMembers()
    }

    useEffect(() => {
        getCrewMembers()
    })

    const handleAddClick = (ev) => {
        setIsDialogShown(true)
        setIsNewRecord(true)
        setName('')
        setRole('')
    }

    const handleSaveClick = () => {
        if(isNewRecord){
            addCrewMember({name, role})
        }else{
            editCrewMember({selectedMember,name, role})
        }
        setIsDialogShown(false)
        setSelectedMember(null)
        setName('')
        setRole('')
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

    const handleEditCrewMember = (rowData) => {
        setSelectedMember(rowData.crewMemberID)
        setName(rowData.name)
        setRole(rowData.role)
        
        setIsDialogShown(true)
        setIsNewRecord(false)
      }

    const handleDelete = (rowData) => {
        console.log(rowData.crewMemberID);
        
        setSelectedMember(rowData.crewMemberID)
        deleteCrewMember(rowData.crewMemberID)
    }  


    const opsColumn = (rowData) => {
        return (
            <>
                <Button label='Edit' icon='pi pi-pencil' onClick={()=>handleEditCrewMember(rowData)}/>
                <Button label='Delete' icon='pi pi-times' className='p-button p-button-danger' onClick={()=>handleDelete(rowData)} />

            </>
        )
    }

    const hideDialog = () => {
        setIsDialogShown(false)
    }

    return (
      <div style={{"display": "grid"}}>
          <DataTable
                value={crewMembers}
                footer={tableFooter}
                lazy
                rows={2}
            >
                <Column header='Name' field='name' />
                <Column header='Role' field='role' />
                <Column body={opsColumn} />
            </DataTable>
            <Dialog header='A CrewMember' visible={isDialogShown} onHide={hideDialog} footer={dialogFooter}>
                <div>
                    <InputText placeholder='name' onChange={(evt) => setName(evt.target.value)} value={name} />
                </div>
                <div>
                    {/* <ListBox value={role} options={roles} onChange={(e) => setRole(e.value)} /> */}
                    <InputText placeholder='Role' onChange={(evt) =>  
                        { if(evt.target.value == 'CAPTAIN' || evt.target.value == 'BOATSWAIN'){
                            setRole(evt.target.value)
                        }else{
                            alert('cannot insert')
                        }}} value={role} />
                </div>
            </Dialog>
      </div>
  
      );
  }
  
  export default CrewMemberList;
  