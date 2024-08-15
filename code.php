<?php
session_start();
require 'dbcon.php';

if(isset($_POST['delete_student']))
{
    $rollno = mysqli_real_escape_string($con, $_POST['delete_student']);
    
    // Fetch the image name
    $image_query = "SELECT image FROM student_details WHERE SAVED_TIME='$rollno'";
    $image_result = mysqli_query($con, $image_query);
    $image_data = mysqli_fetch_assoc($image_result);
    $image_name = $image_data['image'];
    
    // Delete the image file
    if($image_name && file_exists('./uploads/' . $image_name)) {
        unlink('./uploads/'.$image_name);
    }

    // Delete the student record
    $INSERT = "DELETE FROM student_details WHERE SAVED_TIME='$rollno'";
    $query_run = mysqli_query($con, $INSERT);

    if($query_run)
    {
        $_SESSION['message'] = "Student Deleted Successfully";
        header("Location: index.php");
        exit(0);
    }
    else
    {
        $_SESSION['message'] = "Student Not Deleted: " . mysqli_error($con);
        header("Location: index.php");
        exit(0);
    }
}
if(isset($_POST['update_student'])) {
    $year = mysqli_real_escape_string($con, $_POST['student_year']);
    $rollno = mysqli_real_escape_string($con, $_POST['student_rollno']);
    $nameofthegame = mysqli_real_escape_string($con, $_POST['student_name_of_the_game']);
    $studentname = mysqli_real_escape_string($con, $_POST['student_name']);
    $fathername = mysqli_real_escape_string($con, $_POST['student_father_name']);
    $dob = mysqli_real_escape_string($con, $_POST['student_dob']);
    $nameofexam = mysqli_real_escape_string($con, $_POST['student_name_of_exam']);
    $dateandyear = mysqli_real_escape_string($con, $_POST['student_date&year']);
    $presentclass = mysqli_real_escape_string($con, $_POST['student_presentclass']);
    $nameofthepresentclass = mysqli_real_escape_string($con, $_POST['student_nameofthepresentclass']);
    $durationofcourse = mysqli_real_escape_string($con, $_POST['student_durationofcourse']);
    $university = mysqli_real_escape_string($con, $_POST['student_university']);
    $presentcourse = mysqli_real_escape_string($con, $_POST['student_presentcourse']);
    $graduatecourse = mysqli_real_escape_string($con, $_POST['student_graduatecourse']);
    $pgcourse = mysqli_real_escape_string($con, $_POST['student_pgcourse']);
    $previouscourse = mysqli_real_escape_string($con, $_POST['student_previouscourse']);
    $address = mysqli_real_escape_string($con, $_POST['student_address']);
    $phonenumber = mysqli_real_escape_string($con, $_POST['student_phonenumber']);
    $gender = mysqli_real_escape_string($con, $_POST['student_gender']);
    $mothername = mysqli_real_escape_string($con, $_POST['student_mother_name']);
    $aadharnumber = mysqli_real_escape_string($con, $_POST['student_aadhar_number']);
    $tournament = mysqli_real_escape_string($con, $_POST['student_tournament']);
    $tshirt = mysqli_real_escape_string($con, $_POST['student_tshirt']);
    $track = mysqli_real_escape_string($con, $_POST['student_track']);

    $student_id = mysqli_real_escape_string($con, $_POST['update_student']);

    // Retrieve current image name from the database
    $query = "SELECT image FROM student_details WHERE `SAVED_TIME`='$student_id'";
    $query_run = mysqli_query($con, $query);
    $result = mysqli_fetch_assoc($query_run);
    $current_image = $result['image'];

    if(isset($_POST['update_student']) && isset($_FILES['my_image'])) {
        $img_name = $_FILES['my_image']['name'];
        $img_size = $_FILES['my_image']['size'];
        $tmp_name = $_FILES['my_image']['tmp_name'];
        $error = $_FILES['my_image']['error'];

        $img_ex = pathinfo($img_name, PATHINFO_EXTENSION);
        $img_ex_lc = strtolower($img_ex);
        $allowed_exs = array("jpg", "jpeg", "png");
        
        if (in_array($img_ex_lc, $allowed_exs)) {
            // Generate new image name
            $new_img_name = "$rollno" . '.' . $img_ex;
            $img_upload_path = './uploads/' . $new_img_name;
            move_uploaded_file($tmp_name, $img_upload_path);

            // Delete the old image file
            if(file_exists('./uploads/' . $current_image)) {
                unlink('./uploads/' . $current_image);
            }

            // Update query with new image name
            $INSERT = "UPDATE student_details SET 
                NAME_OF_THE_GAME='$nameofthegame',
                ROLL_NO='$rollno',
                NAME_OF_THE_SPORTSPERSON='$studentname',
                `FATHER'S_NAME`='$fathername',
                `MOTHER_NAME`='$mothername',
                DATE_OF_BIRTH='$dob',
                NAME_OF_EXAM='$nameofexam',
                `DATE_&_YEAR`='$dateandyear',
                PRESENT_CLASS='$presentclass',
                `NAME_OF_THE_PRESENT_CLASS`='$nameofthepresentclass',
                DURATION_OF_COURSE='$durationofcourse',
                UNIVERSITY='$university',
                `PRESENT_COURSE`='$presentcourse',
                `GRADUATE_COURSE`='$graduatecourse',
                `P_G_COURSE`='$pgcourse',
                `DETAILS_ABOUT_CHANGE_OF_COURSE_FACULTY,IF_ANY(DETAILS_ABOUT_T`='$previouscourse',
                ADDRESS='$address',
                `PHONE_NUMBER`='$phonenumber',
                GENDER='$gender',
                YEAR='$year',
                image='$new_img_name',
                `AADHAR_NUMBER`='$aadharnumber',
                TOURNAMENTS='$tournament',
                TSHIRT='$tshirt',
                `TRACK_PANT`='$track'
                WHERE `SAVED_TIME`='$student_id'";
        } else {
            // If image extension is not allowed, update without changing the image
            $INSERT = "UPDATE student_details SET 
                NAME_OF_THE_GAME='$nameofthegame',
                ROLL_NO='$rollno',
                NAME_OF_THE_SPORTSPERSON='$studentname',
                `FATHER'S_NAME`='$fathername',
                `MOTHER_NAME`='$mothername',
                DATE_OF_BIRTH='$dob',
                NAME_OF_EXAM='$nameofexam',
                `DATE_&_YEAR`='$dateandyear',
                PRESENT_CLASS='$presentclass',
                `NAME_OF_THE_PRESENT_CLASS`='$nameofthepresentclass',
                DURATION_OF_COURSE='$durationofcourse',
                UNIVERSITY='$university',
                `PRESENT_COURSE`='$presentcourse',
                `GRADUATE_COURSE`='$graduatecourse',
                `P_G_COURSE`='$pgcourse',
                `DETAILS_ABOUT_CHANGE_OF_COURSE_FACULTY,IF_ANY(DETAILS_ABOUT_T`='$previouscourse',
                ADDRESS='$address',
                `PHONE_NUMBER`='$phonenumber',
                GENDER='$gender',
                YEAR='$year',
                `AADHAR_NUMBER`='$aadharnumber',
                TOURNAMENTS='$tournament',
                TSHIRT='$tshirt',
                `TRACK_PANT`='$track'
                WHERE `SAVED_TIME`='$student_id'";
        }
    } else {
        // If no new image is uploaded, update without changing the image
        $INSERT = "UPDATE student_details SET 
            NAME_OF_THE_GAME='$nameofthegame',
            ROLL_NO='$rollno',
            NAME_OF_THE_SPORTSPERSON='$studentname',
            `FATHER'S_NAME`='$fathername',
            `MOTHER_NAME`='$mothername',
            DATE_OF_BIRTH='$dob',
            NAME_OF_EXAM='$nameofexam',
            `DATE_&_YEAR`='$dateandyear',
            PRESENT_CLASS='$presentclass',
            `NAME_OF_THE_PRESENT_CLASS`='$nameofthepresentclass',
            DURATION_OF_COURSE='$durationofcourse',
            UNIVERSITY='$university',
            `PRESENT_COURSE`='$presentcourse',
            `GRADUATE_COURSE`='$graduatecourse',
            `P_G_COURSE`='$pgcourse',
            `DETAILS_ABOUT_CHANGE_OF_COURSE_FACULTY,IF_ANY(DETAILS_ABOUT_T`='$previouscourse',
            ADDRESS='$address',
            `PHONE_NUMBER`='$phonenumber',
            GENDER='$gender',
            YEAR='$year',
            `AADHAR_NUMBER`='$aadharnumber',
            TOURNAMENTS='$tournament',
            TSHIRT='$tshirt',
            `TRACK_PANT`='$track'
            WHERE `SAVED_TIME`='$student_id'";
    }

    $query_run = mysqli_query($con, $INSERT);
    if($query_run) {
        $_SESSION['message'] = "Student Details Updated Successfully";
        header("Location: index.php");
        echo "Student Updated Successfully";
        exit(0);
    } else {
        $_SESSION['message'] = "Student Details Not Updated";
        header("Location: index.php");
        exit(0);
    }
}


if(isset($_POST['save_student']))
{
    $year = mysqli_real_escape_string($con, $_POST['student_year']);
    $rollno = mysqli_real_escape_string($con, $_POST['student_rollno']);
    $nameofthegame = mysqli_real_escape_string($con, $_POST['student_name_of_the_game']);
    $studentname = mysqli_real_escape_string($con, $_POST['student_name']);
    $fathername = mysqli_real_escape_string($con, $_POST['student_father_name']);
    $dob = mysqli_real_escape_string($con, $_POST['student_dob']);
    $nameofexam = mysqli_real_escape_string($con, $_POST['student_name_of_exam']);
    $dateandyear = mysqli_real_escape_string($con, $_POST['student_date&year']);
    $presentclass = mysqli_real_escape_string($con, $_POST['student_presentclass']);
    $nameofthepresentclass = mysqli_real_escape_string($con, $_POST['student_nameofthepresentclass']);
    $durationofcourse = mysqli_real_escape_string($con, $_POST['student_durationofcourse']);
    $university = mysqli_real_escape_string($con, $_POST['student_university']);
    $presentcourse = mysqli_real_escape_string($con, $_POST['student_presentcourse']);
    $graduatecourse = mysqli_real_escape_string($con, $_POST['student_graduatecourse']);
    $pgcourse = mysqli_real_escape_string($con, $_POST['student_pgcourse']);
    $previouscourse = mysqli_real_escape_string($con, $_POST['student_previouscourse']);
    $address = mysqli_real_escape_string($con, $_POST['student_address']);
    $phonenumber = mysqli_real_escape_string($con, $_POST['student_phonenumber']);
    $gender = mysqli_real_escape_string($con, $_POST['student_gender']);
    $mothername = mysqli_real_escape_string($con, $_POST['student_mother_name']);
    $aadharnumber = mysqli_real_escape_string($con, $_POST['student_aadhar_number']);
    $tournament = mysqli_real_escape_string($con, $_POST['student_tournament']);
    $tshirt = mysqli_real_escape_string($con, $_POST['student_tshirt']);
    $track = mysqli_real_escape_string($con, $_POST['student_track']);

    if (!empty($year) || !empty($rollno) || !empty($nameofthegame) || !empty($studentname) || !empty($fathername) || !empty($dob) || !empty($nameofexam) || !empty($dateandyear) || !empty($presentclass) || !empty($nameofthepresentclass) || !empty($durationofcourse) || !empty($university) || !empty($presentcourse) || !empty($graduatecourse) || !empty($pgcourse) || !empty($previouscourse) || !empty($address) || !empty($phonenumber)||empty($gender)) {

        $host = "localhost";
        $dbUsername = "root";
        $dbPassword = "";
        $dbname = "dataentry";
    
        $conn = new mysqli($host, $dbUsername, $dbPassword, $dbname);
        if(mysqli_connect_errno()) {
            die('Connect Error(' . mysqli_connect_errno() . ')' . mysqli_connect_error());
        } else {
            
    $check_duplicate_query = "SELECT * FROM student_details WHERE ROLL_NO = ? AND PRESENT_COURSE = ? AND YEAR = ? AND NAME_OF_THE_GAME= ?";

       
            $INSERT = "INSERT INTO student_details (`ROLL_NO`,
                `NAME_OF_THE_GAME`,
                `NAME_OF_THE_SPORTSPERSON`,
                `FATHER'S_NAME`,
                `MOTHER_NAME`,
                `DATE_OF_BIRTH`,
                `NAME_OF_EXAM`,
                `DATE_&_YEAR`,
                `PRESENT_CLASS`,
                `NAME_OF_THE_PRESENT_CLASS`,
                `DURATION_OF_COURSE`,
                `UNIVERSITY`,
                `PRESENT_COURSE`,
                `GRADUATE_COURSE`,
                `P_G_COURSE`,
                `DETAILS_ABOUT_CHANGE_OF_COURSE_FACULTY,IF_ANY(DETAILS_ABOUT_T`,
                `ADDRESS`,
                `PHONE_NUMBER`,
                `image`,
                `GENDER`,
                `YEAR`,
                `AADHAR_NUMBER`,
                `TOURNAMENTS`,
                `TSHIRT`,
                `TRACK_PANT`

                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?,?,?,?)";
    
    $check_duplicate_stmt = $conn->prepare($check_duplicate_query);
    $check_duplicate_stmt->bind_param('isss', $rollno, $presentcourse, $year,$nameofthegame);
    $check_duplicate_stmt->execute();
    $result = $check_duplicate_stmt->get_result();
        }
    
        if(isset($_POST['save_student']) && isset($_FILES['my_image'])) {
         
        
            $img_name = $_FILES['my_image']['name'];
            $img_size = $_FILES['my_image']['size'];
            $tmp_name = $_FILES['my_image']['tmp_name'];
            $error = $_FILES['my_image']['error'];
        
        }else{
            echo "image was somthing error!";
        }
        if ($result->num_rows > 0) {
        
            $_SESSION['message'] = "Student with the same ( ROLL NO or PRESENT COURSE or YEAR or NAME OF THE GAME ) already exists.";
            header("Location: student-create.php");
            die();
        }else{
        if ($img_size > 10005000) {
    
            echo "it's too large size";
        } else {
            
            $img_ex = pathinfo($img_name, PATHINFO_EXTENSION);
            $img_ex_lc = strtolower($img_ex);
            $allowed_exs = array("jpg", "jpeg", "png"); 
    
            if (in_array($img_ex_lc, $allowed_exs)) {
                $new_img_name ="$rollno".'.'.$img_ex;
                $img_upload_path = './uploads/'.$new_img_name;
                move_uploaded_file($tmp_name, $img_upload_path);
    
                   $stmt = $conn->prepare($INSERT);
                   $stmt->bind_param('issssssssssssssssssssssii', $rollno, $nameofthegame, $studentname, $fathername,$mothername, $dob, $nameofexam, $dateandyear, $presentclass, $nameofthepresentclass, $durationofcourse, $university, $presentcourse, $graduatecourse, $pgcourse, $previouscourse, $address, $phonenumber,$new_img_name,$gender,$year,$aadharnumber,$tournament,$tshirt,$track);
                   $_SESSION['message'] = "Student Created Successfully";
                   header("Location: student-create.php");
                   $stmt->execute();
            }else{
              
                   $stmt = $conn->prepare($INSERT);
                   $stmt->bind_param('issssssssssssssssssssssii', $rollno, $nameofthegame, $studentname, $fathername,$mothername, $dob, $nameofexam, $dateandyear, $presentclass, $nameofthepresentclass, $durationofcourse, $university, $presentcourse, $graduatecourse, $pgcourse, $previouscourse, $address, $phonenumber,$new_img_name,$gender,$year,$aadharnumber,$tournament,$tshirt,$track);
                   $_SESSION['message'] = "Student Created Successfully Without Photo";
                   header("Location: student-create.php");
                   $stmt->execute();
            }
            
           
           
        
        }
    }
    
       
    } else {
        $_SESSION['message'] = "Student Not Created";
        header("Location: student-create.php");
        die();
    }
    

   
}

?>