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

    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">


    <link rel="stylesheet" href="./form.css">
    <title>Student View</title>
</head>

<body>



    <?php
    if (isset($_GET['SAVED_TIME'])) {
        $student_id = mysqli_real_escape_string($con, $_GET['SAVED_TIME']);
        $query = "SELECT * FROM student_details WHERE SAVED_TIME='$student_id' ";
        $query_run = mysqli_query($con, $query);

        if (mysqli_num_rows($query_run) > 0) {
            $student = mysqli_fetch_array($query_run);
            ?>


            <div class="card-header" id="ggg">
                <h4>View Student Details</h4>
                <div class="samp">
                    <a href="#0" onclick="window.print();" class="btn btn-info float-end">PRINT</a>

                    <a href="student-edit.php?SAVED_TIME=<?= $student['SAVED_TIME']; ?>"
                        class="btn btn-success float-endbtn btn-success float-end">EDITE</a>
                    <a href="index.php" class="btn btn-danger float-end">BACK</a>
                    <a href="logout.php" class="btn btn-secondary float-end btn2">LOGOUT</a>
                </div>
            </div>
            <?php
        }
    } else {
        echo "<h5> No Record Found </h5>";
    }
    ?>

    <?php
    if (isset($_GET['SAVED_TIME'])) {
        $student_id = mysqli_real_escape_string($con, $_GET['SAVED_TIME']);
        $query = "SELECT * FROM student_details WHERE SAVED_TIME='$student_id' ";
        $query_run = mysqli_query($con, $query);

        if (mysqli_num_rows($query_run) > 0) {
            $student = mysqli_fetch_array($query_run);



            $dobb = new DateTime($student['DATE_OF_BIRTH']);
            $currentDate = new DateTime();
            $ageee = $currentDate->diff($dobb)->y;

            ?>



            <div class="form_container" id="element-to-print">
                <div class="form_header_class">
                    <div class="form_header_logo_class">
                        <img class="form_header_logo_img_class" src="./image/pngaaa.com-4337857.png" alt="">
                    </div>
                    <div class="form_header_content_class">
                        <h1 class="form_header_content_h1_class">BHARATHIDASAN UNIVERSITY</h1>
                        <h3 class="form_header_content_h3_class">TIRUCHIRAPPALLI - 620 024</h3>
                        <h2 class="form_header_content_h2_class">ELIGIBILITY PROFORMA OF PLAYERS</h2>
                        <div class="form_header_content_row_class">
                            <p class="form_header_content_p_class">Division:&nbsp;</p><i
                                class="form_header_content_p_i_class">Trichy / Thanjavur*</i>
                        </div>
                        <div class="form_header_content_row_class"><i class="form_header_content_p_i_class">
                                <?= $student['YEAR']; ?>
                            </i></div>
                    </div>

                    <div class="form_header_profile_class">

                        <img class="form_header_profile_img_class" src="./uploads/<?= $student['image']; ?>" alt="Candidate’ &nbsp;&nbsp;
       &nbsp;&nbsp;Signature should &nbsp;&nbsp;
        &nbsp;&nbsp;be on top of the&nbsp;&nbsp;&nbsp;
        &nbsp;&nbsp;PHOTO with&nbsp;&nbsp;&nbsp;&nbsp;
        &nbsp;&nbsp;&nbsp;&nbsp;Attestation by the&nbsp;
Principal/HOD">
                    </div>

                </div>
                <div class="form_sub_heading_class">
                    <div class="form_sub_heading_content_class">
                        <p class="form_sub_heading_content_p_class">Name of the College : </p><b
                            class="form_sub_heading_content_p_b_class">&nbsp;Bishop Heber College, Trichy</b>
                    </div>
                    <div class="form_sub_heading_content_class">
                        <p class="form_sub_heading_content_p_class">Name of the Game : </p><b
                            class="form_sub_heading_content_p_b_class">&nbsp;
                            <?= $student['NAME_OF_THE_GAME']; ?> -
                            <?= $student['GENDER']; ?>
                        </b>
                    </div>
                </div>
                <table class="table_class">
                    <tr class="table_tr_class">
                        <td class="table_tr_td_class s_no">1.</td>
                        <td class="table_tr_td_class question" colspan="2">Name of the sportsperson</td>
                        <td class="table_tr_td_class answer">
                            <?= $student['NAME_OF_THE_SPORTSPERSON']; ?>
                        </td>
                    </tr>
                    <tr class="table_tr_class">
                        <td class="table_tr_td_class s_no">2.</td>
                        <td class="table_tr_td_class question" colspan="2">Father’s Name</td>
                        <td class="table_tr_td_class answer">
                            <?= $student["FATHER'S_NAME"]; ?>
                        </td>
                    </tr>
                    <tr class="table_tr_class">
                        <td class="table_tr_td_class s_no">3.</td>
                        <td class="table_tr_td_class question" colspan="2">Mother’s Name</td>
                        <td class="table_tr_td_class answer">
                            <?= $student["MOTHER_NAME"]; ?>
                        </td>
                    </tr>

                    <tr class="table_tr_class ">
                        <td class="table_tr_td_class s_no">4.</td>
                        <td class="table_tr_td_class question" colspan="2">Date of the Birth <br> <b>(Copy of +2 Mark Sheet
                                should be enclosed)</b></td>
                        <td class="table_tr_td_class answer">
                            <div style="display:inline-block;">
                                <?= $student["DATE_OF_BIRTH"]; ?>
                            </div>
                            <div style="display:inline-block;float:right; padding-right:30px;"><b>Age&nbsp;: </b><span
                                    style="border:2px solid black;border-radius:2px;padding:2px;font-weight:500;">
                                    <?= $ageee; ?>
                                </span></div>
                        </td>
                    </tr>

                    <tr class="table_tr_class">
                        <td class="table_tr_td_class s_no">5.</td>
                        <td class="table_tr_td_class question" colspan="2">Aadhar Number</td>
                        <td class="table_tr_td_class answer">
                            <?= $student["AADHAR_NUMBER"]; ?>
                        </td>
                    </tr>

                    <tr class="table_tr_class">
                        <td class="table_tr_td_class s_no" rowspan="2">6.</td>
                        <td class="table_tr_td_class question2" rowspan="2">Date & year of passing Qualifying
                            Examination for First admission to a
                            college / university</td>
                        <td class="table_tr_td_class qqq">Name of Exam</td>
                        <td class="table_tr_td_class answer">
                            <?= $student['NAME_OF_EXAM']; ?>
                        </td>
                    </tr>

                    <tr class="table_tr_class">

                        <td class="table_tr_td_class qqq">Date & Year</td>
                        <td class="table_tr_td_class answer">
                            <?= $student['DATE_&_YEAR']; ?>
                        </td>
                    </tr>


                    <tr class="table_tr_class">
                        <td class="table_tr_td_class s_no">7.</td>
                        <td class="table_tr_td_class question" colspan="2">Present Class</td>
                        <td class="table_tr_td_class answer">
                            <?= $student['PRESENT_CLASS']; ?>
                        </td>
                    </tr>
                    <tr class="table_tr_class">
                        <td class="table_tr_td_class s_no">8.</td>
                        <td class="table_tr_td_class question" colspan="2">Name of the present course</td>
                        <td class="table_tr_td_class answer">
                            <?= $student['NAME_OF_THE_PRESENT_CLASS']; ?>
                        </td>
                    </tr>
                    <tr class="table_tr_class">
                        <td class="table_tr_td_class s_no">9.</td>
                        <td class="table_tr_td_class question" colspan="2">Duration of course</td>
                        <td class="table_tr_td_class answer">
                            <?= $student['DURATION_OF_COURSE']; ?>
                        </td>
                    </tr>
                    <tr class="table_tr_class">
                        <td class="table_tr_td_class s_no" rowspan="2">10.</td>
                        <td class="table_tr_td_class" rowspan="2">Date & year of First admission to</td>
                        <td class="table_tr_td_class">University</td>
                        <td class="table_tr_td_class answer">
                            <?= $student['UNIVERSITY']; ?>
                        </td>
                    </tr>
                    <tr class="table_tr_class">

                        <td class="table_tr_td_class">Present course</td>
                        <td class="table_tr_td_class answer">
                            <?= $student['PRESENT_COURSE']; ?>
                        </td>
                    </tr>
                    <tr class="table_tr_class">
                        <td class="table_tr_td_class s_no" rowspan="2">11.</td>
                        <td class="table_tr_td_class" rowspan="2">Number of years of previous IUT participation while pursuing
                        </td>
                        <td class="table_tr_td_class">Graduate course</td>
                        <td class="table_tr_td_class answer">
                            <?= $student['GRADUATE_COURSE']; ?>
                        </td>
                    </tr>
                    <tr class="table_tr_class">

                        <td class="table_tr_td_class">P.G. course</td>
                        <td class="table_tr_td_class answer">
                            <?= $student['P_G_COURSE']; ?>
                        </td>
                    </tr>

                    <tr class="table_tr_class">
                        <td class="table_tr_td_class s_no">12.</td>
                        <td class="table_tr_td_class question" colspan="2">Details about change of course / faculty, if any<br>
                            (Details about the previous / new - course / faculty)
                        </td>
                        <td class="table_tr_td_class answer">
                            <?= $student['DETAILS_ABOUT_CHANGE_OF_COURSE_FACULTY,IF_ANY(DETAILS_ABOUT_T']; ?>
                        </td>
                    </tr>
                    <tr class="table_tr_class">
                        <td class="table_tr_td_class s_no">13.</td>
                        <td class="table_tr_td_class question" colspan="2">Details of participation in National /<br>
                            International Tournaments *</td>
                        <td class="table_tr_td_class answer">
                            <?= $student["TOURNAMENTS"]; ?>
                        </td>
                    </tr>
                    <tr class="table_tr_class">
                        <td class="table_tr_td_class s_no">14.</td>
                        <td class="table_tr_td_class question" colspan="2">Size of Uniform</td>
                        <td class="table_tr_td_class answer"
                            style="display:flex;width:100%;justify-content:space-around;align-items: center;border:none;">
                            <div><b>T-Shirt : </b><span style="font-weight:400;">
                                    <?= $student["TSHIRT"]; ?>
                                </span></div>
                            <div><b>Track Pant: </b><span style="font-weight:400;">
                                    <?= $student["TRACK_PANT"]; ?>
                                </span></div>

                        </td>
                    </tr>
                    <tr class="table_tr_class">
                        <td class="table_tr_td_class s_no">15.</td>
                        <td class="table_tr_td_class question" colspan="2">Residential address <br>( Phone no / Mobile no)</td>
                        <td class="table_tr_td_class answer">
                            <?= $student['ADDRESS']; ?><br><span style="text-transform:capitalize;font-weight: bolder;">Ph.No.
                            </span><b>
                                <?= $student['PHONE_NUMBER']; ?>
                            </b>
                        </td>
                    </tr>


                </table>
                <div class="footer_class">
                    <div class="form_sub_footer_class">

                        <p class="form_sub_footer_p_class" style="font-size: 14px;line-height:18px">
                            <b>Declaration :</b>
                            I assure you sir, that I am not employed in any
                            organization<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;on
                            full time
                            basis

                        </p>

                        <b class="form_sub_footer_b_class">Signature of the student </b>

                    </div>
                    <div class="form_sub_footer_class form_sub_footer_class2">

                        <b class="form_sub_footer_p_class" style="text-align:center">
                            Signature of the <br>
                            Director of Physical Education
                        </b>

                        <b class="form_sub_footer_p_class" style="text-align:center">
                            Signature of the Principal/HOD<br>
                            College seal with date
                        </b>

                    </div>
                    <div class="form_sub_footer_class form_sub_footer_p_class3">



                        <p class="form_sub_footer_p_class form_sub_footer_p_class33">Eligibility verified<br>
                            Local organiser Signature &amp; Seal </p>

                    </div>
                </div>

            </div>































            <?php
        } else {
            echo "<h4>No Such Id Found</h4>";
        }
    }
    ?>






    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
</body>

</html>