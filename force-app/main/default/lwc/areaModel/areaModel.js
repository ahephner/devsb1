import { api ,wire} from 'lwc';
import LightningModal from 'lightning/modal';
import { createRecord } from 'lightning/uiRecordApi';
import getAreas from '@salesforce/apex/appProduct.areaModel';
import getPickListValues from '@salesforce/apex/lwcHelper.getPickListValues';
import AREA_OBJECT from '@salesforce/schema/Area__c'; 
import NAME_FIELD from '@salesforce/schema/Area__c.Name';
import DATE_FIELD from '@salesforce/schema/Area__c.Date__c';
import SQF_FIELD from '@salesforce/schema/Area__c.Area_Sq_Feet__c';
import ACRE_FIELD from '@salesforce/schema/Area__c.Area_Acres__c';
import TYPE_FIELD from '@salesforce/schema/Area__c.Type__c';  
import PROGRAM_FIELD from '@salesforce/schema/Area__c.Program__c';  
import PREFUOFM from '@salesforce/schema/Area__c.Pref_U_of_M__c'; 
import ORN_AREA from '@salesforce/schema/Area__c.Ornamental_Area__c';
import GALS_REQ from '@salesforce/schema/Area__c.Required_Gallons__c';
import TURF_TYPE from '@salesforce/schema/Area__c.Turf_Type__c';
import {roundRate} from 'c/programBuilderHelper';
export default class AreaModel extends LightningModal{
    @api recid; 
    loading = true; 
    areas= [];     
    sqFt = 0;
    acreSize = 0; 
    areaId; 
    newArea = false; 
connectedCallback() {
 console.log('running')   
    if(this.recid){
        this.start(); 
    }
}

    async start(){
        let x = await getAreas({recordId: this.recid});
        this.areas = x; 
        this.loading = false; 
        console.log(this.areas)
    }
    selectChange(e){
        this.areaId = this.template.querySelector('.slds-select').value;
        if(this.areaId === 'New'){
            let z = this.turfTypes()
            this.newArea = true; 
        }else{
            let initInfo = this.areas.filter((x)=> x.Id === this.areaId)
            this.sqFt = initInfo[0].Area_Sq_Feet__c;
            this.acreSize = initInfo[0].Area_Acres__c
            this.newArea = false; 
        }
    }

    handleThousands(e){
        this.sqFt = e.detail.value;
        this.acreSize = this.sqFt/43560
        this.acreSize = roundRate(this.areaAcres, 3); 
    }

    handleAcre(e){
        this.areaSize = e.detail.value; 
        this.sqFt = this.areaSize * 43560; 
    }
    cancel(){
        this.close(); 
    }

    handleSave(){
        //this.close();
        console.log(this.recid) 
    }
    ///NEW AREA INFO
        areaName;
    areaDate;
    areaAcres = 0; 
    feet = 0;
    areaType;
    areaId;
    proId;
    preUm;
    recordId; 
    ornamentalArea = false; 
    btnLabel = 'Turf Area';
    tankSize;
    finishSpray = 0; 
    typeOptions;
    stand; 

    changeAreaType(){
    //console.log(11,this.recId)
        if(this.prefUM === '100 Gal'){ 
            this.ornamentalArea = true;    
        }else{ 
            this.ornamentalArea = false;
            
        }   
    }
    get setSize(){
        return [
            {label:'Acre', value: 'Acre'},
            {label: 'M', value:'M'}, 
            {label:'Ornamental App', value:'100 Gal'},
            {label:'Pond', value:'Pond'}
        ]
    }
    
    newName(e){
        this.areaName = e.detail.value;
        //this.areaId = undefined;     
    }
        async turfTypes(){
        let getFilters = await getPickListValues({objName:'Area__c', fieldAPI:'Turf_Type__c'})
        this.typeOptions = await getFilters.map(item=>({
            ...item,
            label: item.label,
            value: item.value
        }))
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
        setType(e){
            this.stand = e.detail.value; 
        }
        newType(e){
            this.note = e.detail.value; 
            //console.log(this.note, ' this note');
            
        }
        newUM(e){
            this.prefUM = e.detail.value; 
            this.ornamentalArea = this.prefUM === '100 Gal' ? true : false;  
             
        }
        setTankSize(e){
            this.tankSize = e.detail.value; 
        }
    
        setFinishSpray(e){
            this.finishSpray = e.detail.value; 
        }
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
                fields[PROGRAM_FIELD.fieldApiName] = this.recid;
                fields[PREFUOFM.fieldApiName]= this.prefUM;
                fields[ORN_AREA.fieldApiName] = this.ornamentalArea;
                fields[GALS_REQ.fieldApiName] = this.finishSpray; 
                fields[TURF_TYPE.fieldApiName] = this.stand; 
                const recordInput = {apiName: AREA_OBJECT.objectApiName, fields};
                //create record
                createRecord(recordInput)
                .then(area => {
                    let newV = {Id: area.id, 
                                Name: this.areaName,
                                Area_Acres__c: this.areaAcres,
                                Area_Sq_Feet__c: this.feet
                    }
                    this.areas = [newV, ...this.areas];  
                    this.areaId = area.id; 
                  this.newArea  = false;     
                })
                .catch(error => {
                    alert(error)
                        console.log(JSON.stringify(error))
                    
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
            }else if(inputField.label==='Turf Type'&&!inputField.checkValidity()){
                errorMessages.push(`make sure you enter a ${inputField.label}`);
                isValid = false;
            }
        })
        return {isValid, errorMessages}; 
}
}