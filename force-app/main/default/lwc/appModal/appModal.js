import { LightningElement, api } from 'lwc';
import { createRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import AREA_OBJECT from '@salesforce/schema/Area__c'; 
import NAME_FIELD from '@salesforce/schema/Area__c.Name';
import DATE_FIELD from '@salesforce/schema/Area__c.Date__c';
import SQF_FIELD from '@salesforce/schema/Area__c.Area_Sq_Feet__c';
import ACRE_FIELD from '@salesforce/schema/Area__c.Area_Acres__c';
import TYPE_FIELD from '@salesforce/schema/Area__c.Type__c';  
import PROGRAM_FIELD from '@salesforce/schema/Area__c.Program__c';  
import PREFUOFM from '@salesforce/schema/Area__c.Pref_U_of_M__c'; 
import {roundRate} from 'c/programBuilderHelper';
export default class AppModal extends LightningElement {
    openAppModal = false; 
    note;
    areaName;
    areaDate;
    areaAcres = 0; 
    feet = 0;
    areaType;
    areaId;
    proId;
    preUm;
    recordId; 
    @api recId; 
//open close modal
    @api 
    openMe(){
        this.feet = 0;
        this.areaAcres = 0;
        this.areaName = '';
        this.prefUM = ''; 
        this.openAppModal = true; 
    }
    closeModal(){
        this.openAppModal = false;
    }

    //get api values from object settings
    get setNotes(){
        return [
            {label:'Athletic Field' , value: 'Athletic Field'},
            {label:'Greens', value: 'Greens'},
            {label:'Tees', value: 'Tees'},
            {label:'Fairways' , value: 'Fairways'},
            {label:'Fairways/Tees' , value: 'Fairways/Tees'},
            {label:'Rough' , value: 'Rough'},
            {label:'Other' , value: 'Other'} 
        ]
    }   
    get setSize(){
        return [
            {label:'Acre', value: 'Acre'},
            {label: 'M', value:'M'}
        ]
    }
    //input field actions
    newName(e){
        this.areaName = e.detail.value;
        this.areaId = undefined; 
        
    }
    newDate(e){
        this.areaDate = e.detail.value;
    }
    newFeet(e){
        this.feet = e.detail.value;
        this.areaAcres = this.feet/43560
        this.areaAcres = roundRate(this.areaAcres, 3); 
        //console.log(this.areaAcres)
        
    }
    newAcre(e){
        this.areaAcres = e.detail.value; 
        this.feet = this.areaAcres * 43560; 
                    
    }
    newType(e){
        this.note = e.detail.value; 
        //console.log(this.note, ' this note');
        
    }
    newUM(e){
        this.prefUM = e.detail.value; 
       //console.log(this.recId);
         
    }
    isValid;
    errMsgs; 
    saveArea(event){
        event.preventDefault();

          this.isValid = this.valid().isValid; 
        if(!this.isValid){
             this.errMsgs = this.valid().errorMessages; 
        }else{
        const fields ={}; 
        fields[NAME_FIELD.fieldApiName] = this.areaName;
        fields[DATE_FIELD.fieldApiName] = this.areaDate;
        fields[SQF_FIELD.fieldApiName] = this.feet;
        fields[ACRE_FIELD.fieldApiName] = this.areaAcres;
        fields[TYPE_FIELD.fieldApiName] = this.note;
        fields[PROGRAM_FIELD.fieldApiName] = this.recId;
        fields[PREFUOFM.fieldApiName]= this.prefUM;
        
        
        const recordInput = {apiName: AREA_OBJECT.objectApiName, fields};
        //create record
        createRecord(recordInput)
        .then(area => {
            this.areaId = area.id; 
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Area created',
                    variant: 'success',
                }),
            ); 
            this.clearField(); 
        })
        .then(this.openAppModal = false)
        .then(()=>{
            //console.log('alex is talking');
            //send a new event to the parent -> addProductButton
            this.dispatchEvent(new CustomEvent('newarea',{
                detail: this.areaId
            })); 
        }).catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error creating record',
                    message: error.body.message,
                    variant: 'error',
                }),
                console.log(JSON.stringify(error))
            );
        });
    }
}

valid(){
    let isValid = true;
    let inputFields = this.template.querySelectorAll('.validate');
    let errorMessages = [];
    inputFields.forEach(inputField => {
        //console.log(inputField.label, inputField.value)
        if(inputField.type === 'number' && inputField.value<=0){
            errorMessages.push(`make sure you have ${inputField.label} set`);
            isValid = false; 
        }else if((inputField.type==='text' || inputField.label==='Pref Unit of Measure') &&!inputField.checkValidity()){
            errorMessages.push(`make sure you enter a ${inputField.label}`);
            isValid = false;
        }
    })
    return {isValid, errorMessages}; 
}

//does not work
// clearField(){
//     let inputFields = this.template.querySelectorAll('.validate');
//     inputFields.forEach(inputField => {
//         inputField.value = ''; 
        
//     })
}
