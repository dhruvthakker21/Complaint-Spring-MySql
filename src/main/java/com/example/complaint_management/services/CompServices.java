package com.example.complaint_management.services;

import com.example.complaint_management.model.Complaint;
import com.example.complaint_management.model.User;
import com.example.complaint_management.repo.CompRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CompServices {

    @Autowired
    private CompRepo repo;

    public Complaint saveComplaints(Complaint complaint) {
        complaint.setStatus("OPEN");
        complaint.setCreatedAt(LocalDateTime.now());
        return repo.save(complaint);

    }

    public Complaint getComplaintById(Integer id) {
        return repo.findById(id).orElse(new Complaint());
    }

    public List<Complaint> getAllComplaints(String role) {
        if ("ADMIN".equals(role)) {          // null-safe comparison
            return repo.findAll();
        }
        return repo.findAll();               // for now return all anyway
    }


    public List<Complaint> getComplaintByUserId(Integer userId) {
        return repo.findByUserId(userId);
    }

    public Complaint updateComplaint(Integer id, Complaint complaint, String role) {

        return repo.findById(id)
                .map(existingComplaint -> {
                    // description user update kari sake
                    if (complaint.getDescription() != null) {
                        existingComplaint.setDescription(complaint.getDescription());
                    }

                    // status only ADMIN change kari sake
                    if (complaint.getStatus() != null) {
                        if(!role.equals("ADMIN")){
                            throw new RuntimeException("Only admin can update status");
                        }
                        existingComplaint.setStatus(complaint.getStatus());
                    }

                    // user change normally allow nathi karvu (optional)
                    if (complaint.getUser() != null && role.equals("ADMIN")) {
                        existingComplaint.setUser(complaint.getUser());
                    }
                    return repo.save(existingComplaint);
                }).orElseThrow(() -> new RuntimeException("Complaint not found with id: " + id));
    }




    public String deleteComplaint(Integer id, String role) {

        if(!role.equals("ADMIN")){
            throw new RuntimeException("Only admin can delete complaint");
        }

        repo.deleteById(id);
        return "Deleted";
    }

    public String deleteByStatus(String status, String role) {

        if(!role.equals("ADMIN")){
            throw new RuntimeException("Only admin can delete complaints");
        }

        int deletedCount = repo.deleteByStatus(status);

        if (deletedCount > 0) {
            return deletedCount + " complaints with status '" + status + "' were deleted.";
        } else {
            return "No complaints found with status '" + status + "'.";
        }
    }
}