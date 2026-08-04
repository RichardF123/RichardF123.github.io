# include <iostream>
# include <cmath>
# include <iomanip>
# include <fstream>
# include <string>
using namespace std; 
void Merge_Sort(int a[], int s);
 int D(string filename){
 	int n;
	ifstream file;
	file.open(filename.c_str());
	file >> n; 
	int array[n];
	for(int i = 0; i<n ; i++){
		file >> array[i]; 
	}
	file.close();
	Merge_Sort(array,n);
	int d = array[1]-array[0];
	for(int i = 1; i < n-1; i ++){
		if (array[i+1] - array[i] < d) d = array[i+1] - array[i];
	}
	return d;
 } 
 void Merge_Sort(int a[], int s){
 	if(s == 1) return;
 	int b[s/2];
 	int c[s-s/2];
 	for(int i = 0; i < s/2; i++){
 		b[i] = a[i];
	 }
	 for (int j = s/2; j < s; j++){
	 	c[j-s/2] = a[j];
	 }
	 Merge_Sort(b,s/2);
	 Merge_Sort(c,s-s/2);
	 int i = 0, j = 0, k = 0;
	 while(i < s && j < s/2 && k < s-s/2){
	 	if(b[j]<c[k]){
	 		a[i] = b[j];
	 		i++;
	 		j++;
		 }
		else{
			a[i] = c[k];
			i++;
			k++;
		}
	 }
	 while(i < s && j == s/2){
	 	a[i] = c[k];
	 	k++;
	 	i++;
	 }
	 while(i < s && k == s-s/2){
	 	a[i] = b[j];
	 	j++;
	 	i++;
	 }
 }
 
 int main(){
 	string filename;
 	cin >> filename;
 	cout << D(filename);
 	return 0;
 }
