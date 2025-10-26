// src/controllers/projectController.js
const Project = require('../models/Project');
const User = require('../models/User');

const checkUserRoleInProject = (project, userId) => {
  if (!project || !project.members) return null;
  const member = project.members.find(m => m.user.equals(userId));
  return member ? member.role : null;
};

// @desc    Tüm projeleri getir
// @route   GET /api/projects
exports.getProjects = async (req, res, next) => {
  try {
    // Sadece 'members' dizisinde req.user._id'si bulunan projeleri getir
    const projects = await Project.find({ 'members.user': req.user._id });
    res.status(200).json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Yeni bir proje oluştur
// @route   POST /api/projects
exports.createProject = async (req, res, next) => {
  try {

    // req.body'den sadece izin verilen alanları al (güvenlik için)
    const { name, description, status, start_date, end_date } = req.body;

    const project = await Project.create({
      name,
      description,
      status,
      start_date,
      end_date,
      // Projeyi oluşturan kişiyi (req.user) 'members' dizisine
      // 'Proje Yöneticisi' rolüyle ekle
      members: [
        {
          user: req.user._id, // Giriş yapan kullanıcının ID'si
          role: 'Proje Yöneticisi',
        },
      ],
    });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getProjectById = async (req, res, next) => {
  try {
    // Üye bilgilerini de çekmek için .populate() kullanalım
    const project = await Project.findById(req.params.id)
                            .populate('members.user', 'name email'); 

    if (!project) {
      return res.status(404).json({ success: false, error: 'Bu ID ile proje bulunamadı' });
    }

    // YETKİ KONTROLÜ: Kullanıcı bu projenin üyesi mi?
    const callerRole = checkUserRoleInProject(project, req.user._id);
    if (!callerRole) {
      return res.status(403).json({ success: false, error: 'Bu projeyi görüntüleme yetkiniz yok.' });
    }

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, error: 'Proje bulunamadı' });

    // YETKİ KONTROLÜ
    const callerRole = checkUserRoleInProject(project, req.user._id);
    if (callerRole !== 'Proje Yöneticisi') {
      return res.status(403).json({ success: false, error: 'Sadece proje yöneticileri projeyi güncelleyebilir.' });
    }
    
    // Projeyi güncelle (members alanı hariç)
    const { name, description, status, start_date, end_date } = req.body;
    project = await Project.findByIdAndUpdate(req.params.id, 
        { name, description, status, start_date, end_date }, 
        { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, error: 'Proje bulunamadı' });
    
    // YETKİ KONTROLÜ
    const callerRole = checkUserRoleInProject(project, req.user._id);
    if (callerRole !== 'Proje Yöneticisi') {
      return res.status(403).json({ success: false, error: 'Sadece proje yöneticileri projeyi silebilir.' });
    }
    
    // TODO: Projeyi silmeden önce bağlı tüm görevleri de silmek iyi bir pratiktir.
    // await Task.deleteMany({ project_id: req.params.id });
    
    await project.deleteOne();
    res.status(200).json({ success: true, data: {} }); 
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.addProjectMember = async (req, res, next) => {
  try {
    const { email, role } = req.body; // Eklenecek kullanıcının e-postası ve rolü
    const projectId = req.params.id;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, error: 'Proje bulunamadı' });

    // 1. YETKİ KONTROLÜ: Bu işlemi yapan kişi 'Proje Yöneticisi' mi?
    const callerRole = checkUserRoleInProject(project, req.user._id);
    if (callerRole !== 'Proje Yöneticisi') {
      return res.status(403).json({ success: false, error: 'Bu işlemi yapma yetkiniz yok.' });
    }

    // 2. Eklenecek kullanıcıyı e-posta ile bul
    const userToAdd = await User.findOne({ email: email });
    if (!userToAdd) return res.status(404).json({ success: false, error: 'Bu e-posta ile kullanıcı bulunamadı.' });

    // 3. Kullanıcı zaten projeye üye mi?
    if (project.members.find(m => m.user.equals(userToAdd._id))) {
      return res.status(400).json({ success: false, error: 'Kullanıcı zaten projeye üye.' });
    }

    // 4. Kullanıcıyı projeye ekle
    project.members.push({ user: userToAdd._id, role: role });
    await project.save();
    
    // Üyeleri kullanıcı bilgileriyle birlikte döndür
    const populatedProject = await project.populate('members.user', 'name email');
    res.status(200).json({ success: true, data: populatedProject.members });

  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Proje üyesinin rolünü güncelle (Sadece Proje Yöneticisi yapabilir)
// @route   PUT /api/projects/:id/members/:memberId
exports.updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body; // Yeni rol
    const { id: projectId, memberId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, error: 'Proje bulunamadı' });

    // 1. YETKİ KONTROLÜ
    const callerRole = checkUserRoleInProject(project, req.user._id);
    if (callerRole !== 'Proje Yöneticisi') {
      return res.status(403).json({ success: false, error: 'Bu işlemi yapma yetkiniz yok.' });
    }

    // 2. Üyeyi bul ve rolünü güncelle
    const member = project.members.find(m => m.user.equals(memberId));
    if (!member) return res.status(404).json({ success: false, error: 'Proje üyesi bulunamadı.' });

    // Güvenlik: Proje Yöneticisi kendi rolünü düşüremez (eğer son yöneticiyse)
    // (Bu kuralı şimdilik basit tutalım: Kendini güncelleyemesin)
    if (member.user.equals(req.user._id)) {
       return res.status(400).json({ success: false, error: 'Kendi rolünüzü güncelleyemezsiniz.' });
    }

    member.role = role;
    await project.save();
    
    const populatedProject = await project.populate('members.user', 'name email');
    res.status(200).json({ success: true, data: populatedProject.members });

  } catch (error) {
     res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Proje üyesini çıkar (Sadece Proje Yöneticisi yapabilir)
// @route   DELETE /api/projects/:id/members/:memberId
exports.removeProjectMember = async (req, res, next) => {
   try {
    const { id: projectId, memberId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, error: 'Proje bulunamadı' });
    
    // 1. YETKİ KONTROLÜ
    const callerRole = checkUserRoleInProject(project, req.user._id);
    if (callerRole !== 'Proje Yöneticisi') {
      return res.status(403).json({ success: false, error: 'Bu işlemi yapma yetkiniz yok.' });
    }

    // 2. Proje Yöneticisi kendini atamaz
    if (memberId.toString() === req.user._id.toString()) {
       return res.status(400).json({ success: false, error: 'Proje Yöneticisi kendini projeden atamaz.' });
    }

    // 3. Üyeyi bul ve sil (Mongoose'un .pull metodunu kullanabiliriz)
    project.members.pull({ user: memberId });
    await project.save();
    
    res.status(200).json({ success: true, data: {} });

  } catch (error) {
     res.status(400).json({ success: false, error: error.message });
  }
};

