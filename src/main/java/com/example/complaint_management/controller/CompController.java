package com.example.complaint_management.controller;


import com.example.complaint_management.model.Complaint;
import com.example.complaint_management.services.CompServices;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestMethod;

import java.util.List;
@CrossOrigin(origins = "*", methods = {
        RequestMethod.GET,
        RequestMethod.POST,
        RequestMethod.PUT,
        RequestMethod.DELETE,
        RequestMethod.OPTIONS
})
@RequestMapping("/compl")
@RestController
public class CompController {

    @Autowired
    private CompServices service;

    @PostMapping("/create")
    public Complaint saveComplaints(@RequestBody Complaint complaint){
        return service.saveComplaints(complaint);
    }

    @GetMapping("/{id}")
    public Complaint getComplaintById(@PathVariable Integer id){
        return service.getComplaintById(id);
    }

    @GetMapping("/all")
    public List<Complaint> getAllComplaints(
            @RequestParam(required = false, defaultValue = "ADMIN") String role){

        return service.getAllComplaints(role);
    }

    @GetMapping("/user/{userId}")
    public List<Complaint> getComplaintByUserId(@PathVariable Integer userId){
        return service.getComplaintByUserId(userId);
    }

    @PutMapping("/update/{id}")
    public Complaint updateComplaint(@PathVariable Integer id,
                                     @RequestBody Complaint complaint,
                                     @RequestParam(required = false, defaultValue = "ADMIN") String role) {
        return service.updateComplaint(id, complaint, role);
    }

    @DeleteMapping("/del/{id}")
    public String deleteComplaint(@PathVariable Integer id,
                                  @RequestParam String role){

        return service.deleteComplaint(id, role);
    }

   @DeleteMapping("/dele")
   public String deleteByStatus(@RequestParam String status,
                                @RequestParam(required = false, defaultValue = "ADMIN") String role) {
       return service.deleteByStatus(status, role);
   }

}
