public with sharing class programToOpportunity {
	
    @auraEnabled
    public static string createOpp(string progId){
        Date cd = System.today();
           system.debug(progId);
        Program__c program = [select account__c, name from Program__c where id =: progId];
       //record type id is not the same as PROD
       //prod record type: 0122M000001ElAYQA0
       //sandbox record type: 01275000000CgcYAAS
        Opportunity opp = new Opportunity(Name=program.Name, AccountId = Program.Account__c, CloseDate= cd, StageName='Working', 
                                          pricebook2id='01s410000077vSKAAY', recordtypeid='01275000000CgcYAAS');
        
        insert opp; 

        return opp.Id; 
    }
    @auraEnabled
    public static string createOppProduct(string oppId, list<string> appIds){
        Integer maxTime = Limits.getLimitCpuTime(); 
       
        system.debug('max time '+ maxTime);
        string mess; 
        try{
            Map<Id,App_Product__c> prod = new Map<Id,App_Product__c>([select id,Area_Id__c, Product__c, Unit_Price__c, Required_Units__c, Margin__c,Product_Cost__c,
            	                   									 Product_Code__c, Note_Other__c, Units_Consumed__c, Unit_Cost__c from App_Product__c where Application__c in: appIds and 
                                                                      (NOT Product__r.Name like '%MANUAL%')]);
			system.debug('prod '+prod.values());
            Map<String, OpportunityLineItem> lines = new Map<String, OpportunityLineItem>();
            
               for(App_Product__c x : prod.values()){
                Integer runTime = Limits.getCpuTime(); 
                //system.debug(lines.get(x.Product_Code__c).OpportunityId);
                OpportunityLineItem li = lines.get(x.Product__c);
  
                //this if is causing the issue. 
                if(li != null){
                    //lines.get(x.Product__c).UnitPrice += x.Unit_Price__c;
                    //lines.get(x.Product__c).CPQ_Unit_Price__c += x.Unit_Price__c;
                    lines.get(x.Product__c).Quantity += x.Units_Consumed__c;
                    //lines.get(x.Product__c).Cost__c += x.Product_Cost__c;

                    //lines.get(x.Product__c).CPQ_Margin__c = (1 - (lines.get(x.Product__c).Cost__c /lines.get(x.Product__c).UnitPrice))*100;
                }else{
                    
                   //not running in here. Is causing entire thing to break. Even with current debug statement in this wont show. 
                    OpportunityLineItem nli = new OpportunityLineItem();
                    nli.OpportunityId = oppId;
                    //system.debug('Product2Id '+x.Product__c + ' Unit Price '+ x.Unit_Price__c+ ' Unit Cost '+x.Unit_Cost__c);
                    //system.debug('Margin '+x.Margin__c+' Units Req '+x.Units_Consumed__c);
                    //system.debug('Units Price '+x.Unit_Price__c+' Note '+x.Units_Consumed__c);
                    nli.Product2Id = x.Product__c;
                    nli.CPQ_Unit_Price__c = x.Unit_Price__c;
                    nli.Cost__c  = x.Product_Cost__c;
                    nli.CPQ_Margin__c = x.Margin__c;
                    nli.UnitPrice = x.Unit_Price__c;
                    nli.Quantity = x.Units_Consumed__c;
                    nli.Description = x.Note_Other__c; 
                    //system.debug('2 '+nli);
                    lines.put(x.Product__c, nli);

                }
            }
            //system.debug('lines '+lines);
            for(string x:lines.keySet() ){
                //system.debug('before qty ' + lines.get(x).Quantity);
                lines.get(x).Quantity = lines.get(x).Quantity.round(SYSTEM.RoundingMode.CEILING);
                //system.debug('after qty ' + lines.get(x).Quantity);
            }
            insert lines.values();
            mess = 'success'; 
        }catch(Exception e){
            mess = string.valueOf(e);
            system.debug('error'); 
            system.debug(mess); 
        }

        return mess; 
    }

}