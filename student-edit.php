<?php
session_start();
if (!isset($_SESSION['authenticated'])) {
    $_SESSION['error'] = "Please login to access this page";
    header('Location: login.php');
    exit(0);
}
require 'dbcon.php';
?>

<!doctype html>
<html lang="en">

<head>
    <!-- Required meta tags -->
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="./index.css">
    <title>Student Edit</title>
</head>

<body>

  

        <?php include('message.php'); ?>

        
         
               
                    <div class="card-header">
                        <h4 class="hero">Student Edit
                       
                        </h4>
                        <a href="logout.php" class="cc">LOGOUT</a>
                        <a href="index.php" class="cc">BACK TO HOME</a>
                        
                    </div>
                    <div class="card-body">
                        <?php
                        if (isset($_GET['SAVED_TIME'])) {
                            $student_id = mysqli_real_escape_string($con, $_GET['SAVED_TIME']);
                            $query = "SELECT * FROM student_details WHERE SAVED_TIME='$student_id' ";
                            $query_run = mysqli_query($con, $query);

                            if (mysqli_num_rows($query_run) > 0) {
                                $student = mysqli_fetch_array($query_run);
                                ?>
                                <div class="form_container_class">
                                

<form action="code.php" class="form-contianer_form_class" method="post" enctype="multipart/form-data">



    <div class="form-contianer_form_input-container_class form-contianer-0-1">
        <label for="student_year" class="form-contianer_form_input-container_label_class">Academice Year</label>
        <input name="student_year" id="student_year" type="text" value="<?=$student['YEAR'];?>"
            class="form-contianer_form_input-container_input_class" placeholder="Enter the Year"
         required />
    </div>





    <div class="form-contianer_form_input-container_class form-contianer-1">
        <label for="student_rollno" class="form-contianer_form_input-container_label_class">Roll No.</label>
        <input name="student_rollno" id="student_rollno" type="tel"
            class="form-contianer_form_input-container_input_class" placeholder="Enter the Roll No."
            pattern="[0-9]{9}" required value="<?=$student['ROLL_NO'];?>" />
    </div>
    <div class="form-contianer_form_input-container_class form-contianer-2">
        <label for="student_name_of_the_game" class="form-contianer_form_input-container_label_class">Name
            of the Game</label>
        <input name="student_name_of_the_game" list="student_name_of_the_game" id="student_name_of_the_gam"
            class="form-contianer_form_input-container_input_class" placeholder="Enter the Name of the Game"
            required value="<?=$student['NAME_OF_THE_GAME'];?>" />
        <datalist id="student_name_of_the_game" >
        <option value="CRICKET">
                        <option value="FOOTBALL">
                        <option value="CHESS">
                        <option value="BASKETBALL">
                        <option value="VOLLEYBALL">
                        <option value="HOCKEY">
                        <option value="TABLE TENNIS">
                        <option value="BADMINTON">
                        <option value="CROSS COUNTRY">
                        <option value="FENCING & CYCLE">
                        <option value="SWIMMING">
                        <option value="ARCHERY">
                        <option value="TENNIS">
                        <option value="KABADDI">
                        <option value="ATHLETICS">
                        <option value="KHO - KHO">
                        <option value="BEST PHYSIQUE">
                        <option value="NETBALL">
                        <option value="HANDBALL">
                        <option value="BOXING">
                        <option value="BALL BADMINTON">
                        <option value="YOGASANA">
                        <option value="TAEKWONDO">
                        <option value="KARATE">
        </datalist>

    </div>
    <div class="form-contianer_form_input-container_class form-contianer-3">
        <b>GENDER</b>
        <div class="inner_gender">

            <input name="student_gender" id="student_gender_male" type="radio" value="MALE" <?php echo ($student["GENDER"] == 'MALE') ? 'checked' : ''; ?> 
                class="form-contianer_form_input-container_input_class" value="MALE" required />
            <label for="student_gender_male"
                class="form-contianer_form_input-container_label_class">MALE</label>
        </div>
        <div class="inner_gender">

            <input name="student_gender" id="student_gender_female" type="radio"
                class="form-contianer_form_input-container_input_class" value="FEMALE" value="FEMALE" <?php echo ($student["GENDER"] == 'FEMALE') ? 'checked' : ''; ?> />
            <label for="student_gender_female"
                class="form-contianer_form_input-container_label_class">FEMALE</label>
        </div>
    </div>
    <div class="form-contianer_form_input-container_class form-contianer-4">
        <label for="student_name" class="form-contianer_form_input-container_label_class">Name of the
            Sportsperson</label>
        <input name="student_name" id="student_name" type="text"
            class="form-contianer_form_input-container_input_class" required
            placeholder="Enter the Name of the Sportsperson" value="<?=$student['NAME_OF_THE_SPORTSPERSON'];?>" />
    </div>
    <div class="form-contianer_form_input-container_class form-contianer-5">
        <label for="student_father_name" class="form-contianer_form_input-container_label_class">Father
            Name</label>
        <input name="student_father_name" id="student_father_name" type="text"
            class="form-contianer_form_input-container_input_class" required 
            placeholder="Enter the Father Name" value="<?=$student["FATHER'S_NAME"];?>" />
    </div>
    <div class="form-contianer_form_input-container_class form-contianer-6">
        <label for="student_dob" class="form-contianer_form_input-container_label_class">DATE OF
            BIRTH</label>
        <input name="student_dob" id="student_dob" type="date" value="<?php echo $student["DATE_OF_BIRTH"]; ?>"
            class="form-contianer_form_input-container_input_class" required />
    </div>

    <div class="form-contianer_form_input-container_class form-contianer-7">
        <p class="form-contianer_form_input-container_p_class">DATE & YEAR OF PASSING QUALIFYING
            EXAMINATION FOR FIRST ADMISSION TO A
            COLLEGE/ UNIVERSITY</p>
        <div class="form-contianer_form_input-container_inner-container_class inner_row">


            <div class="form-contianer_form_input-container_inner-container_input-container_class">
                <label for="student_name_of_exam"
                    class="form-contianer_form_input-container_inner-container_input-container_label_class">NAME
                    OF EXAM</label>
                <input name="student_name_of_exam" id="student_name_of_exam" type="text"
                    class="form-contianer_form_input-container_inner-container_input-container_input_class"
                    required placeholder="Enter the Name of Exam" value="<?=$student["NAME_OF_EXAM"];?>" />
            </div>
            <div class="form-contianer_form_input-container_inner-container_input-container_class">
                <label for="student_date&year"
                    class="form-contianer_form_input-container_inner-container_input-container_label_class">DATE
                    & YEAR</label>
                <input name="student_date&year" id="student_date&year" type="text"
                    class="form-contianer_form_input-container_inner-container_input-container_input_class"
                    required required placeholder="Enter the Date & Year" value="<?=$student["DATE_&_YEAR"];?>" />
            </div>


        </div>
    </div>
    <div class="form-contianer_form_input-container_class form-contianer-8">
        <label for="student_presentclass" class="form-contianer_form_input-container_label_class">Present
            Class</label>
        <input name="student_presentclass" id="student_presentclass" type="text"
            class="form-contianer_form_input-container_input_class" required
            placeholder="Enter the Present Class" value="<?=$student["PRESENT_CLASS"];?>" />
    </div>
    <div class="form-contianer_form_input-container_class form-contianer-9">
        <label for="student_nameofthepresentclass"
            class="form-contianer_form_input-container_label_class">NAME OF THE PRESENT CLASS</label>
        <input id="student_nameofthepresentclass" name="student_nameofthepresentclass" list="college_departments" 
                        class="form-contianer_form_input-container_select_class" required value="<?=$student['NAME_OF_THE_PRESENT_CLASS'];?>"/>
                       
                        
                        <datalist id="college_departments">
                        <option value="">Select</option>
                        <optgroup label="Bachelor's Degrees"
                            class="form-contianer_form_input-container_select_option_optgroup_class">
                            <option value="B.A.History">
                            <option value="B.A.Tamil">
                            <option value="B.A.Economics">
                            <option value="B.A.English">
                            <option value="B.Com (Bachelor of Commerce)">
                            <option value="B.Com.Computer Application">
                            <option value="B.Com.International Accounting (ACCA, UK)">
                            <option value="B.Com.Professional Accounting">
                            <option value="B.Com.Business Process Management">
                            <option value="B.Com.Business Analytics">
                            <option value="B.Com.Strategic Finance (US CMA)">
                            <option value="B.Com.Fintech">
                            <option value="B.B.A ((Bachelor of Business Administration))">
                            <option value="B.Voc.Accounting Taxation">
                            <option value="B.Sc.Actuarial Mathematics Science">
                            <option value="B.Sc.Mathematics">
                            <option value="B.Sc.Physics">
                            <option value="B.Sc.Chemistry">
                            <option value="B.Sc.Zoology">
                            <option value="B.Sc.Botany">
                            <option value="B.Sc.Computer Science">
                            <option value="B.Sc.Biotechnology">
                            <option value="B.C.A (Bachelor of Computer Application)">
                            <option value="B.Voc.Information Technology">
                            <option value="B.Sc.Env Sci">
                            <option value="BSc.Nutrition & Dietetics">
                            <option value="B.Sc.Bioinformatics">
                            <option value="B.Voc.Visual Communication">
                            <option value="B.Sc.Aviation">
                            <option value="B.B.A.Aviation & Ground Handling">
                        </optgroup>

                        <!-- Master's Degrees -->
                        <optgroup label="Master's Degrees"
                            class="form-contianer_form_input-container_select_option_optgroup_class">
                            <option value="M.B.A (Master of Business Administration)">
                            <option value="M.Com (Master of Commerce)">
                            <option value="M.A.Economics (Master of Arts in Economics)">
                            <option value="M.A.English">
                            <option value="M.A.History">
                            <option value="M.A.Tamil">
                            <option value="M.S.W (Master of Social Work)">
                            <option value="M.Sc.Actuarial Science">
                            <option value="M.Sc.Bioinformatics">
                            <option value="M.Sc.Biotechnology">
                            <option value="M.Sc.Botany">
                            <option value="M.Sc.Chemistry">
                            <option value="M.Sc.Computer Science">
                            <option value="M.Sc.Data Science">
                            <option value="M.Sc.Environmental Sciences">
                            <option value="M.Sc.Food Science and Nutrition">
                            <option value="M.Sc.Information Technology">
                            <option value="M.Sc.Library & Information Science">
                            <option value="M.Sc.Mathematics">
                            <option value="M.Sc.Physics">
                            <option value="M.Sc.Zoology">
                            <option value="M.C.A (Master of Computer Applications)">
                        </optgroup>
                        </datalist>

    </div>

    <div class="form-container_form_input-container_class form-contianer-10">
        <label for="student_durationofcourse"
            class="form-container_form_input-container_label_class">DURATION OF COURSE</label>
        <select id="student_durationofcourse" name="student_durationofcourse"
            class="form-container_form_input-container_select_class" required>
            <option value="">Select</option>
            <option value="2 YEARS" <?php echo ($student["DURATION_OF_COURSE"] == '2 YEARS') ? 'selected' : ''; ?>>2 YEARS</option>
            <option value="3 YEARS" <?php echo ($student["DURATION_OF_COURSE"] == '3 YEARS') ? 'selected' : ''; ?>>3 YEARS</option>
            <option value="5 YEARS" <?php echo ($student["DURATION_OF_COURSE"] == '5 YEARS') ? 'selected' : ''; ?>>5 YEARS</option>
        </select>
    </div>
    <div class="form-contianer_form_input-container_class form-contianer-11">
        <p class="form-contianer_form_input-container_p_class">DATE & YEAR OF FIRST ADMISSION TO</p>
        <div class="form-contianer_form_input-container_inner-container_class inner_row">


            <div class="form-contianer_form_input-container_inner-container_input-container_class ">
                <label for="student_university"
                    class="form-contianer_form_input-container_inner-container_input-container_label_class">UNIVERSITY</label>
                <input name="student_university" id="student_university" type="text"
                    class="form-contianer_form_input-container_inner-container_input-container_input_class"
                    required placeholder="Enter the University" value="<?=$student["UNIVERSITY"];?>" />
            </div>
            <div class="form-contianer_form_input-container_inner-container_input-container_class">
                <label for="student_presentcourse"
                    class="form-contianer_form_input-container_inner-container_input-container_label_class">PRESENT
                    COURSE</label>
                <input name="student_presentcourse" id="student_presentcourse" type="text"
                    class="form-contianer_form_input-container_inner-container_input-container_input_class"
                    required placeholder="Enter the Present Course" value="<?=$student["PRESENT_COURSE"];?>" />
            </div>


        </div>
    </div>


    <div class="form-contianer_form_input-container_class form-contianer-12">
        <p class="form-contianer_form_input-container_p_class">NUMBER OF YEAR OF PREVIOUS IUT
            PARTICIPATION WHILE PURSUING</p>
        <div class="form-contianer_form_input-container_inner-container_class inner_row">


            <div class="form-contianer_form_input-container_inner-container_input-container_class">
                <label for="student_graduatecourse"
                    class="form-contianer_form_input-container_inner-container_input-container_label_class">GRADUATE
                    COURSE</label>
                <select id="student_graduatecourse" name="student_graduatecourse"
                    class="form-contianer_form_input-container_select_class" required>
                    <option value="">Select</option>
                    <option value="NIL" <?php echo ($student["GRADUATE_COURSE"] == 'NIL') ? 'selected' : ''; ?>>NIL</option>
                    <option value="1" <?php echo ($student["GRADUATE_COURSE"] == '1') ? 'selected' : ''; ?>>1</option>
                    <option value="2" <?php echo ($student["GRADUATE_COURSE"] == '2') ? 'selected' : ''; ?>>2</option>
                    <option value="3" <?php echo ($student["GRADUATE_COURSE"] == '3') ? 'selected' : ''; ?>>3</option>
                </select>
            </div>


            <div class="form-contianer_form_input-container_inner-container_input-container_class">
                <label for="student_pgcourse"
                    class="form-contianer_form_input-container_inner-container_input-container_label_class">PG</label>
                <select id="student_pgcourse" name="student_pgcourse"
                    class="form-contianer_form_input-container_select_class" required>
                    <option value="">Select</option>
                    <option value="NIL" <?php echo ($student["P_G_COURSE"] == 'NIL') ? 'selected' : ''; ?>>NIL</option>
                    <option value="1" <?php echo ($student["P_G_COURSE"] == '1') ? 'selected' : ''; ?>>1</option>
                    <option value="2" <?php echo ($student["P_G_COURSE"] == '2') ? 'selected' : ''; ?>>2</option>
                    <option value="3" <?php echo ($student["P_G_COURSE"] == '3') ? 'selected' : ''; ?>>3</option>
                </select>
            </div>


        </div>
    </div>

    <div class="form-contianer_form_input-container_class form-contianer-13">
        <label for="student_previouscourse" class="form-contianer_form_input-container_label_class">Details
            about change of course / faculty, if any<br>
            (Details about the previous / new - course / faculty)
        </label>
        <input name="student_previouscourse" id="student_previouscourse" type="text"
            class="form-contianer_form_input-container_input_class" required  value="<?=$student["DETAILS_ABOUT_CHANGE_OF_COURSE_FACULTY,IF_ANY(DETAILS_ABOUT_T"];?>"/>
    </div>

    <div class="form-contianer_form_input-container_class form-contianer-14">
        <label for="student_address" class="form-contianer_form_input-container_label_class">Residential
            address</label>
        <textarea name="student_address" id="student_address" cols="30" rows="5"
            class="form-contianer_form_input-container_textarea_class" required>
            <?=$student["ADDRESS"];?>
</textarea>












    </div>
    
<div class="form-contianer_form_input-container_class form-contianer-19">
                    <label for="student_aadhar_number" class="form-contianer_form_input-container_label_class">Aadhar
                        Number</label>
                    <input name="student_aadhar_number" id="student_aadhar_number" type="text" value="<?=$student["AADHAR_NUMBER"];?>"
                        class="form-contianer_form_input-container_input_class" required
                        placeholder="Enter the Aadhar Number" />
                </div>


                <div class="form-contianer_form_input-container_class form-contianer-20">
                    <label for="student_tournament" class="form-contianer_form_input-container_label_class">Details of participation in National / International Tournaments *
                        Name</label>
                    <input name="student_tournament" id="student_tournament" type="text" value="<?=$student["TOURNAMENTS"];?>"
                        class="form-contianer_form_input-container_input_class" required
                        placeholder="Enter the Tournament Name" />
                </div>
                <div class="form-contianer_form_input-container_class form-contianer-21">
                    <label for="student_tshirt" class="form-contianer_form_input-container_label_class">Tshirt Size</label>
                    <input name="student_tshirt" id="student_tshirt" type="tel" value="<?=$student["TSHIRT"];?>"
                        class="form-contianer_form_input-container_input_class" required
                        placeholder="Enter the Tshirt size" />
                </div>
                <div class="form-contianer_form_input-container_class form-contianer-22">
                    <label for="student_track" class="form-contianer_form_input-container_label_class">Track Size</label>
                    <input name="student_track" id="student_track" type="tel" value="<?=$student["TRACK_PANT"];?>"
                        class="form-contianer_form_input-container_input_class" required
                        placeholder="Enter the Track size" />
                </div>
                
                <div class="form-contianer_form_input-container_class form-contianer-18">
                    <label for="student_mother_name" class="form-contianer_form_input-container_label_class">Mother Name
                        Name</label>
                    <input name="student_mother_name" id="student_mother_name" type="text" value="<?=$student["MOTHER_NAME"];?>"
                        class="form-contianer_form_input-container_input_class" required
                        placeholder="Enter the Mother Name" />
                </div>
    <div class="form-contianer_form_input-container_class form-contianer-15">
        <label for="student_phonenumber" class="form-contianer_form_input-container_label_class">Phone /
            Mobile no</label>
        <input name="student_phonenumber" id="student_phonenumber" type="tel"
            class="form-contianer_form_input-container_input_class" required pattern="[0-9]{10}"
            placeholder="Enter the Phone / Mobile No." value="<?=$student["PHONE_NUMBER"];?>"/>
    </div>
    <div class="upload-btn-wrapper form-contianer-16"> 
        <button class="btn">Click To! Upload the Sportsperson Passport Size Photo</button>
        <input type="file" name="my_image" value="./uploads/<?=$student["image"];?>"/>
    </div>

    <div class="form-contianer_form_submit-button-container_class form-contianer-17">

        <input type="submit" name="update_student" value="<?=$student["SAVED_TIME"];?>"
            class="form-contianer_form_submit-button-input_class" />
    </div>



</form>


</div>
                                <?php
                            } else {
                                echo "<h4>No Such Id Found</h4>";
                            }
                        }
                        ?>
                    </div>
             
            
  

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
</body>

</html>