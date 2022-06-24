public with sharing class programToOpportunity {
	
    @auraEnabled
    public static string createOpp(string progId){
        Date cd = System.today();
           system.debug(progId);
        Program__c program = [select account__c, name from Program__c where id =: progId];
       //record type id is not the same as PROD
        Opportunity opp = new Opportunity(Name=program.Name, AccountId = Program.Account__c, CloseDate= cd, StageName='Working', pricebook2id='01s410000077vSKAAY', recordtypeid='01275000000CgcYAAS');
        
        insert opp; 

        return opp.Id; 
    }
    @auraEnabled
    public static string createOppProduct(string oppId, list<string> appIds){
        Integer maxTime = Limits.getLimitCpuTime(); 
        string mess; 
        try{
            Map<Id,App_Product__c> prod = new Map<Id,App_Product__c>([select id,Area_Id__c, Product__c, Unit_Price__c, Units_Required__c, Margin__c,
            	                   									 Product_Code__c from App_Product__c where Application__c in: appIds]);
			//system.debug('prod '+prod.values());
            Map<String, OpportunityLineItem> lines = new Map<String, OpportunityLineItem>();
            
            for(App_Product__c x : prod.values()){
                system.debug(x.Product__c); 
                OpportunityLineItem l = lines.get(x.Product_Code__c);
                system.debug('1 '+l);
                //this if is causing the issue. 
                if(l == null){
                    system.debug('null');
                    //not running in here. Is causing entire thing to break. Even with current debug statement in this wont show. 
                    OpportunityLineItem nli = new OpportunityLineItem();
                    nli.OpportunityId = oppId;
                    nli.Product2Id = x.Product__c;
                    nli.CPQ_Unit_Price__c = x.Unit_Price__c;
                    nli.Cost__c  = x.Unit_Cost__c;
                    nli.CPQ_Margin__c = x.Margin__c;
                    nli.UnitPrice = x.Unit_Cost__c;
                    nli.Quantity = x.Units_Required__c;
                    system.debug('2 '+nli);
                    lines.put(x.Product_Code__c, nli);
                }else{
                    system.debug('3 '+l);
                    lines.get(x.Product__c).UnitPrice += x.Unit_Price__c;
                    lines.get(x.Product__c).CPQ_Unit_Price__c += x.Unit_Price__c;
                    lines.get(x.Product__c).Quantity += x.Units_Required__c;
                    lines.get(x.Product__c).Cost__c += x.Unit_Cost__c;
                    lines.get(x.Product__c).CPQ_Margin__c = (1 - (lines.get(x.Product__c).Cost__c /lines.get(x.Product__c).UnitPrice))*100;
                }
            }
            system.debug(lines);
            //insert lines.values();
        }catch(Exception e){
            mess = string.valueOf(e);
        }

        return mess; 
    }
}