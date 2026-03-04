// Use .apex files to store anonymous Apex.
// You can execute anonymous Apex in VS Code by selecting the
//     apex text and running the command:
//     SFDX: Execute Anonymous Apex with Currently Selected Text
// You can also execute the entire file by running the command:
//     SFDX: Execute Anonymous Apex with Editor Contents

string UOM = 'thousands';
decimal areaSize = 1500.0; 
decimal acreSize= UOM == 'acre' ? areaSize : (areaSize * 43.56); 
system.debug(acreSize); 


