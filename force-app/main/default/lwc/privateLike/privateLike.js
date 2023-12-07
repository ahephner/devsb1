import { LightningElement, track, wire,api } from 'lwc';
import { getRecord,updateRecord,createRecord } from "lightning/uiRecordApi";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import queryType from '@salesforce/apex/lwcHelper.getRecordTypeId';
import userId from "@salesforce/user/Id";
import OWNERID from '@salesforce/schema/Program__c.CreatedById';
import PUBLISHED from '@salesforce/schema/Program__c.Share_Program__c';
import LIKE_COUNT from '@salesforce/schema/Program__c.Like_count__c';
import LIKE from '@salesforce/schema/Program__c.Like__c';
import PRO_ID from '@salesforce/schema/Program__c.Id';
//for like statehood
import QUERY from '@salesforce/schema/Query__c'
import Q_USER from '@salesforce/schema/Query__c.User__c'
import Q_PRO_ID from '@salesforce/schema/Query__c.Program__c'
import Q_RECTYPE from '@salesforce/schema/Query__c.RecordTypeId'

const FIELDS = [OWNERID, PUBLISHED, LIKE_COUNT, LIKE ]
export default class PrivateLike extends LightningElement {
    currentUser = userId;
    @api recordId;  
    @track likeState = false;

    likeCount;
    ownerId;
    published;
    showPublish; 
    showLikes;
    queryRecordType;  
    

    @wire(queryType, ({objectName: 'Query__c', recTypeName: 'Likes'}))
    wiredRec({error, data}){
        if(data){
            this.queryRecordType = data;
            console.log(1, this.queryRecordType);
            
        }else if(error){
            let message = "Unknown error";
            if (Array.isArray(error.body)) {
                message = error.body.map((e) => e.message).join(", ");
            } else if (typeof error.body.message === "string") {
                message = error.body.message;
            }
            this.dispatchEvent(
                new ShowToastEvent({
                title: "Error loading contact",
                message,
                variant: "error",
                }),
            );
        }
        
    }


    @wire(getRecord,{ recordId: "$recordId", fields: FIELDS })
    wiredData({data,error}){
        if(data){
            this.likeCount = data.fields.Like_count__c.value;
            this.showLikes = this.likeCount > 0 ? true : false; 
            this.ownerId = data.fields.CreatedById.value;
            this.published = data.fields.Share_Program__c.value; 
            this.showPublish = this.ownerId === this.currentUser ? true : false; 
        }else if(error){
            let message = "Unknown error";
            if (Array.isArray(error.body)) {
                message = error.body.map((e) => e.message).join(", ");
            } else if (typeof error.body.message === "string") {
                message = error.body.message;
            }
            this.dispatchEvent(
                new ShowToastEvent({
                title: "Error loading contact",
                message,
                variant: "error",
                }),
            );
        }
    }
        

    handleLikeButtonClick(event) {
        //const buttonNumber = event.target.dataset.buttonNumber;
         
        this.likeState = !this.likeState ? true : false;
        this.likeCount =  this.likeState ? +1 : -1 
        this.showLikes = this.likeCount > 0 ? true : false; 
        
        //update record
        const fields = {};
        fields[PRO_ID.fieldApiName] = this.recordId;
        fields[LIKE_COUNT.fieldApiName] = this.likeCount;
        const addCount = {fields}
        updateRecord(addCount)
            .then(()=>{
            const fields = {};
            fields[Q_PRO_ID.fieldApiName] = this.recordId;
            fields[Q_RECTYPE.fieldApiName] = this.queryRecordType;
            fields[Q_USER.fieldApiName] = this.currentUser;
            const addLike = {apiName: QUERY.objectApiName, fields}
            createRecord(addLike)
                .then((acc)=>{
                    this.dispatchEvent(
                        new ShowToastEvent({
                          title: "Liked",
                          message: "Thanks for the feedback",
                          variant: "success",
                        }),
                      );
                })
        }) 
    }

    pubProgram(){
        this.published = !this.published
        //update record to show published
        const fields = {};
        fields[PRO_ID.fieldApiName] = this.recordId;
        fields[PUBLISHED.fieldApiName] = this.published;
        const pubRec = {fields}
        updateRecord(pubRec)
           
    }
}