import { LightningElement,wire, api } from 'lwc';
import { getRecord, getFieldValue } from "lightning/uiRecordApi";
import { MessageContext, publish} from 'lightning/messageService';
import Program_Builder from '@salesforce/messageChannel/Program_Builder__c';
import Id from '@salesforce/user/Id';
import ACC_REC from '@salesforce/schema/Program__c.Account__c';
import AreaModel from 'c/areaModel';
const FIELDS = [ACC_REC];
export default class ProgramBtnGroup extends LightningElement {
    @api recid;    
    @wire(MessageContext)
        messageContext; 
        

    @wire(getRecord, { recordId: "$recid", fields: FIELDS })
            account;
        get accID(){
            return getFieldValue(this.account.data, ACC_REC);
        }
    handleNewEvent(){
        //using recId to pass to table to get areas
            const payload = {
                connector: true,
                message: this.recid,
                // areaId: this.area,
                 accountId: this.accID
            }
            publish(this.messageContext, Program_Builder, payload); 
    }

    async openArea(x){
        const newMod = await AreaModel.open({
            recid: this.recid
        }).then((res)=>{
            //no response here all handled by flow and model
        })
    }

    updateLocation(){
         this.dispatchEvent(new CustomEvent('location',{
            detail:{
                    newLocation: true,                        
                }
                    })
                );
    }
}