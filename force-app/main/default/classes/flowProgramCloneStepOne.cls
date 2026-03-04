public class flowProgramCloneStepOne {

    	//inputs from flow
    public class programInputs{
        @InvocableVariable
        public string programId;
        
        @InvocableVariable
        public string programName; 
        
        @InvocableVariable
        public Integer numbAreas;
        
        @InvocableVariable
        public Decimal areaSize;
        
        @InvocableVariable
        public string accountId; 
    }
    
    @InvocableMethod(label='Clone Progarm, Areas and Apps' description='Step One. Step two ' )
    public static list<string> flowBusinessInBoxStepOne(list<programInputs> params){
        SavePoint sp = Database.setSavepoint();
        
        programInputs info = params[0];
        string err;
        string newProgramId;
        Program__c newPro;
        list<string> passBack= new list<string>(); 
        List<Application__c> apps = new List<Application__c>();
        try{
            //Get old program
            Program__c oldPro = [select name, Account__c, year__c from Program__c where id =: info.programId];
            newPro = oldPro.clone(false);
            newPro.Name = info.programName;
            newPro.Account__c = info.AccountId; 
            insert newPro;
            
            newProgramId = newPro.Id;
            passBack.add(newProgramId); 
            
            if(newPro.id != null){
                    List<Area__c> areaCopy = new List<Area__c>();
     
                    for(Area__c a1 : [Select x.id, x.name, x.Area_Acres__c, x.Area_K_Total__c,x.Area_N_Total__c,  
                      x.Area_P_Total__c,x.Area_Sq_Feet__c,x.Date__c, x.Type__c, x.PrevID__c, Pref_U_of_M__c 
                      from area__c x where program__c = :info.programId]){ 
                        Area__c na = a1.clone(false);
                        na.Program__c  = newPro.id;
                        na.PrevID__c = a1.id; 
                        areaCopy.add(na);
            }
                insert areaCopy;
                
                 for(area__c j: areaCopy){
        for(application__c ap : [select a.Id, a.Name, a.Area__c, a.repeat__c, a.Note__c , a.Clone__c, 
                                a.Date__c,  a.Weeks_Apart__c, a.Number_of_Apps__c, a.Prev_App_Id__c, Program_ID__c
                                 from Application__c a where a.area__c = :j.previd__c]){
                                    Application__c newApp = ap.clone(false); 
                                    newApp.area__c = j.Id;
                                    newApp.Prev_App_Id__c = ap.Id; 
                                    newApp.Clone__c = True; 
                                    apps.add(newApp);
                                 }
    }
    insert apps;
            }
        }catch(Exception e){
            Database.rollback(sp);
            system.debug(e); 
        }
        
        return passBack;
    }
}