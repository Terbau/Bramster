## How to use the course-updator

1. Create a folder in the course-updator folder named `courses`
2. Create a folder for each actual course that you want to add in the courses folder. They must be named by their fagkode like `mfel1050`
3. Add the names of the folder to the `COURSES` variable in `index.ts`
4. Go to the website that you want to import questions from. Open the network tab in inspect element and check on `Preserve log`
5. Enter the exam you want questions from then check the network log. There should be many responses from firebase. Find the one that actually includes questions and answers. 
6. Copy the entire response and paste it into a file with a name of your own choice in the course folder. E.g. `/course-updator/courses/mfel1050/2017vår.txt`.

NOTE: You can make multiple files holding responses in each course folder. The program will go through them all.

WARNING: Don't run the program twice with the same questions. This will create duplicates!!!