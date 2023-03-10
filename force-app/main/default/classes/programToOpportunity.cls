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
       // Integer runTime = Limits.getCpuTime(); 
        string mess; 
        try{
            Map<Id,App_Product__c> prod = new Map<Id,App_Product__c>([select id,Area_Id__c, Product__c, Unit_Price__c, Units_Required__c, Margin__c,Product_Cost__c,
            	                   									 Product_Code__c from App_Product__c where Application__c in: appIds]);
			//system.debug('prod '+prod.values());
            Map<String, OpportunityLineItem> lines = new Map<String, OpportunityLineItem>();
            system.debug('retrieved');
            system.debug(prod.values());
            for(App_Product__c x : prod.values()){
                
                //system.debug(lines.get(x.Product_Code__c).OpportunityId);
                OpportunityLineItem li = lines.get(x.Product__c);
                
                //this if is causing the issue. 
                if(li != null){
                    lines.get(x.Product__c).UnitPrice += x.Unit_Price__c;
                    lines.get(x.Product__c).CPQ_Unit_Price__c += x.Unit_Price__c;
                    lines.get(x.Product__c).Quantity += x.Units_Required__c;
                    lines.get(x.Product__c).Cost__c += x.Product_Cost__c;
                    //lines.get(x.Product__c).CPQ_Margin__c = (1 - (lines.get(x.Product__c).Cost__c /lines.get(x.Product__c).UnitPrice))*100;
                }else{
                   //not running in here. Is causing entire thing to break. Even with current debug statement in this wont show. 
                    OpportunityLineItem nli = new OpportunityLineItem();
                    nli.OpportunityId = oppId;
                    //system.debug('Product2Id '+x.Product__c + ' Unit Price '+ x.Unit_Price__c+ ' Unit Cost '+x.Unit_Cost__c);
                    //system.debug('Margin '+x.Margin__c+' Units Req '+x.Units_Required__c);
                    nli.Product2Id = x.Product__c;
                    nli.CPQ_Unit_Price__c = x.Unit_Price__c;
                    nli.Cost__c  = x.Product_Cost__c;
                    nli.CPQ_Margin__c = x.Margin__c;
                    nli.UnitPrice = x.Unit_Price__c;
                    nli.Quantity = x.Units_Required__c;
                    //system.debug('2 '+nli);
                    lines.put(x.Product__c, nli);

                }
            }
            
            insert lines.values();
            mess = 'success'; 
        }catch(Exception e){
            mess = string.valueOf(e);
        }