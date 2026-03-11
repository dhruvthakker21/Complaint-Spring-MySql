package com.example.complaint_management.controller;


import com.example.complaint_management.model.Complaint;
import com.example.complaint_management.services.CompServices;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://127.0.0.1:5500")
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
    public List<Complaint> getAllComplaints(){
        return service.getAllComplaints();
    }

    @GetMapping("/user/{userId}")
    public List<Complaint> getComplaintByUserId(@PathVariable Integer userId){
        return service.getComplaintByUserId(userId);
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateComplaintById(@PathVariable Integer id, @RequestBody Complaint complaint) {
        try {
            Complaint updated = service.updateComplaint(id, complaint);
            return ResponseEntity.ok(updated); // Returns 200 OK and the data
        } catch (RuntimeException e) {
            // Returns 404 Not Found and your specific message
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @DeleteMapping("/del/{id}")
    public String deleteComplaint(@PathVariable Integer id){
          return service.deleteComplaint(id);
    }

    @DeleteMapping("/dele")
    public String deleteByStatus(@RequestParam String status) {
        return service.deleteByStatus(status);
    }

}
