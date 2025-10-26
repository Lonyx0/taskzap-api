// src/controllers/taskController.js
const Task = require('../models/Task');
const Project = require('../models/Project'); // Projenin varlığını kontrol etmek için

const checkUserRoleInProject = (project, userId) => {
  if (!project || !project.members) return null;
  const member = project.members.find(m => m.user.equals(userId));
  return member ? member.role : null;
};

// @desc    Bir projeye ait tüm görevleri getir
// @route   GET /api/projects/:projectId/tasks
exports.getTasksForProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, error: 'Proje bulunamadı' });

    // YETKİ KONTROLÜ
    const callerRole = checkUserRoleInProject(project, req.user._id);
    if (!callerRole) {
      return res.status(403).json({ success: false, error: 'Bu projedeki görevleri görüntüleme yetkiniz yok.' });
    }

    const tasks = await Task.find({ project_id: req.params.projectId });
    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Bir proje için yeni görev oluştur
// @route   POST /api/projects/:projectId/tasks
exports.createTaskForProject = async (req, res, next) => {
  try {
    req.body.project_id = req.params.projectId;
    req.body.created_by_id = req.user._id;

    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, error: 'Proje bulunamadı' });

    // YETKİ KONTROLÜ (İsteğinize göre: "sadece bu kişi taskleri ekleyip atayabilecek")
    const callerRole = checkUserRoleInProject(project, req.user._id);
    if (callerRole !== 'Proje Yöneticisi') {
      return res.status(403).json({ success: false, error: 'Sadece proje yöneticileri görev oluşturabilir.' });
    }

    const task = await Task.create(req.body);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Tek bir görevi ID ile getir
// @route   GET /api/tasks/:id
exports.getTaskById = async (req, res, next) => {
  try {
    // Görevi ve bağlı olduğu projenin üyelerini çek
    const task = await Task.findById(req.params.id)
                        .populate({ 
                            path: 'project_id', 
                            select: 'members' 
                        })
                        .populate('assigned_to_id', 'name email')
                        .populate('created_by_id', 'name email');

    if (!task) return res.status(404).json({ success: false, error: 'Görev bulunamadı' });
    
    // YETKİ KONTROLÜ
    const project = task.project_id;
    const callerRole = checkUserRoleInProject(project, req.user._id);
    if (!callerRole) {
      return res.status(403).json({ success: false, error: 'Bu görevi görüntüleme yetkiniz yok.' });
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Bir görevi güncelle
// @route   PUT /api/tasks/:id
exports.updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Görev bulunamadı' });

    const project = await Project.findById(task.project_id);
    if (!project) return res.status(404).json({ success: false, error: 'Görevin bağlı olduğu proje bulunamadı.' });

    // YETKİ KONTROLÜ (Karmaşık Kural)
    const callerRole = checkUserRoleInProject(project, req.user._id);
    
    // 1. Proje Yöneticisi DEĞİLSE:
    if (callerRole !== 'Proje Yöneticisi') {
      // 2. Proje Üyesi mi VE görev ona mı atanmış?
      const isAssignedToUser = task.assigned_to_id && task.assigned_to_id.equals(req.user._id);
      if (callerRole !== 'Proje Üyesi' || !isAssignedToUser) {
        return res.status(403).json({ success: false, error: 'Bu görevi güncelleme yetkiniz yok.' });
      }
      
      // Güvenlik: Proje Üyesi, görevi başkasına atayamaz veya proje ID'sini değiştiremez
      delete req.body.assigned_to_id;
      delete req.body.project_id;
    }
    // Yetki tamam. (Proje Yöneticisi VEYA görev kendine atanmış Proje Üyesi)

    task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Bir görevi sil
// @route   DELETE /api/tasks/:id
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Görev bulunamadı' });

    const project = await Project.findById(task.project_id);
    if (!project) return res.status(404).json({ success: false, error: 'Görevin bağlı olduğu proje bulunamadı.' });

    // YETKİ KONTROLÜ (updateTask ile aynı mantık)
    const callerRole = checkUserRoleInProject(project, req.user._id);
    
    if (callerRole !== 'Proje Yöneticisi') {
      const isAssignedToUser = task.assigned_to_id && task.assigned_to_id.equals(req.user._id);
      if (callerRole !== 'Proje Üyesi' || !isAssignedToUser) {
        return res.status(403).json({ success: false, error: 'Bu görevi silme yetkiniz yok.' });
      }
    }
    
    await task.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};